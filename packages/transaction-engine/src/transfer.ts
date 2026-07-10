import { createHash } from "node:crypto";
import {
  AuditActor,
  BudgetPeriodType,
  IdempotencyStatus,
  PolicyDecision,
  Prisma,
  type PrismaClient,
  TransactionAction,
  TransactionStatus,
} from "@pay3/database";
import type { PolicySnapshot } from "@pay3/database";
import { evaluateTransferPolicy } from "@pay3/policy-engine";
import { resolveRecipient } from "@pay3/recipient-resolver";
import { APPROVAL_EXPIRY_MS, TRANSACTION_MAX_RETRIES } from "@pay3/shared";
import { buildAndSubmitPayment, createStellarClient, type StellarClient } from "@pay3/stellar";
import type { Pay3Config } from "@pay3/shared";
import { Decimal } from "@prisma/client/runtime/library";
import type { AiSessionManager } from "@pay3/session-manager";
import { TransactionEngineError } from "./errors.js";
import { isRetriableTransferError } from "./retry.js";

const STUCK_SUBMITTING_MESSAGE =
  "Submission was interrupted. Verify the payment on-chain before creating a new request.";

function hashRequest(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export interface TransferRequestInput {
  aiSessionId: string;
  userId: string;
  smartAccountId: string;
  idempotencyKey: string;
  recipientInput: string;
  asset: string;
  amount: string;
  policySnapshot: PolicySnapshot;
}

export class TransactionEngine {
  private readonly stellar: StellarClient;

  constructor(
    private readonly prisma: PrismaClient,
    config: Pay3Config,
    private readonly aiSessions: AiSessionManager,
  ) {
    this.stellar = createStellarClient(config);
  }

  async executeTransfer(input: TransferRequestInput) {
    const requestHash = hashRequest([
      input.aiSessionId,
      input.idempotencyKey,
      input.recipientInput,
      input.asset,
      input.amount,
    ]);

    const existingIdempotency = await this.prisma.idempotencyRecord.findUnique({
      where: {
        aiSessionId_idempotencyKey: {
          aiSessionId: input.aiSessionId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { transaction: true },
    });

    if (existingIdempotency) {
      if (existingIdempotency.requestHash !== requestHash) {
        throw new TransactionEngineError(
          "IDEMPOTENCY_CONFLICT",
          "Idempotency key was reused with a different request payload.",
        );
      }
      if (existingIdempotency.transaction) {
        return existingIdempotency.transaction;
      }
    }

    const recipient = await resolveRecipient(
      this.prisma,
      input.userId,
      input.recipientInput,
    );

    const now = new Date();
    const dailyUsage = await this.prisma.budgetUsage.findUnique({
      where: {
        aiSessionId_periodType_periodStart_asset: {
          aiSessionId: input.aiSessionId,
          periodType: BudgetPeriodType.DAILY,
          periodStart: startOfUtcDay(now),
          asset: input.asset.toUpperCase(),
        },
      },
    });
    const monthlyUsage = await this.prisma.budgetUsage.findUnique({
      where: {
        aiSessionId_periodType_periodStart_asset: {
          aiSessionId: input.aiSessionId,
          periodType: BudgetPeriodType.MONTHLY,
          periodStart: startOfUtcMonth(now),
          asset: input.asset.toUpperCase(),
        },
      },
    });

    let policyDecision: PolicyDecision;
    try {
      policyDecision = evaluateTransferPolicy({
        snapshot: input.policySnapshot,
        asset: input.asset,
        amount: input.amount,
        dailySpent: dailyUsage?.spentAmount.toString() ?? "0",
        monthlySpent: monthlyUsage?.spentAmount.toString() ?? "0",
        recipientContactId: recipient.contactId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Policy rejected.";
      return this.prisma.transaction.create({
        data: {
          userId: input.userId,
          aiSessionId: input.aiSessionId,
          smartAccountId: input.smartAccountId,
          idempotencyKey: input.idempotencyKey,
          action: TransactionAction.TRANSFER,
          asset: input.asset.toUpperCase(),
          amount: new Decimal(input.amount),
          recipientInput: input.recipientInput,
          recipientAddress: recipient.stellarAddress,
          contactId: recipient.contactId,
          policyDecision: PolicyDecision.REJECTED,
          status: TransactionStatus.REJECTED,
          rejectionReason: message,
        },
      });
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.idempotencyRecord.upsert({
        where: {
          aiSessionId_idempotencyKey: {
            aiSessionId: input.aiSessionId,
            idempotencyKey: input.idempotencyKey,
          },
        },
        create: {
          aiSessionId: input.aiSessionId,
          idempotencyKey: input.idempotencyKey,
          requestHash,
          status: IdempotencyStatus.IN_PROGRESS,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        update: {},
      });

      const created = await tx.transaction.create({
        data: {
          userId: input.userId,
          aiSessionId: input.aiSessionId,
          smartAccountId: input.smartAccountId,
          idempotencyKey: input.idempotencyKey,
          action: TransactionAction.TRANSFER,
          asset: input.asset.toUpperCase(),
          amount: new Decimal(input.amount),
          recipientInput: input.recipientInput,
          recipientAddress: recipient.stellarAddress,
          contactId: recipient.contactId,
          policyDecision,
          status:
            policyDecision === PolicyDecision.PENDING_APPROVAL
              ? TransactionStatus.PENDING_APPROVAL
              : TransactionStatus.AUTO_APPROVED,
        },
      });

      await tx.idempotencyRecord.update({
        where: {
          aiSessionId_idempotencyKey: {
            aiSessionId: input.aiSessionId,
            idempotencyKey: input.idempotencyKey,
          },
        },
        data: { transactionId: created.id },
      });

      if (policyDecision === PolicyDecision.PENDING_APPROVAL) {
        await tx.approvalRequest.create({
          data: {
            transactionId: created.id,
            userId: input.userId,
            aiSessionId: input.aiSessionId,
            expiresAt: new Date(Date.now() + APPROVAL_EXPIRY_MS),
          },
        });
      }

      return created;
    });

    if (transaction.status === TransactionStatus.AUTO_APPROVED) {
      return this.submitTransfer(transaction.id);
    }

    return transaction;
  }

  async submitTransfer(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { aiSession: true },
    });

    if (!transaction) {
      throw new TransactionEngineError("TRANSACTION_NOT_FOUND", "Transaction not found.");
    }

    if (
      transaction.status !== TransactionStatus.AUTO_APPROVED &&
      transaction.status !== TransactionStatus.APPROVED
    ) {
      throw new TransactionEngineError(
        "INVALID_STATE",
        `Transaction cannot be submitted from status ${transaction.status}.`,
      );
    }

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.SIGNING },
    });

    const signerSecret = this.aiSessions.getSessionSignerSecret(
      transaction.aiSession.encryptedSessionKey,
    );

    let lastError: Error | null = null;
    let retryCount = transaction.retryCount;

    while (retryCount <= TRANSACTION_MAX_RETRIES) {
      try {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.SUBMITTING, retryCount },
        });

        const hash = await buildAndSubmitPayment(this.stellar, {
          sourcePublicKey: transaction.aiSession.sessionPublicKey,
          destinationPublicKey: transaction.recipientAddress!,
          assetCode: transaction.asset,
          amount: transaction.amount!.toString(),
          signerSecret,
        });

        const completed = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.SUCCESS,
              stellarTransactionHash: hash,
              completedAt: new Date(),
            },
          });

          await this.recordSpend(tx, transaction);
          await tx.idempotencyRecord.updateMany({
            where: { transactionId: transaction.id },
            data: { status: IdempotencyStatus.COMPLETED },
          });
          await tx.auditLog.create({
            data: {
              userId: transaction.userId,
              aiSessionId: transaction.aiSessionId,
              transactionId: transaction.id,
              action: "TRANSFER_SUCCESS",
              actor: AuditActor.AI_SESSION,
              details: { hash, amount: transaction.amount?.toString(), asset: transaction.asset },
            },
          });

          return updated;
        });

        return completed;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Transfer failed.");
        const retriable = isRetriableTransferError(lastError.message);
        if (!retriable || retryCount >= TRANSACTION_MAX_RETRIES) {
          break;
        }
        retryCount += 1;
      }
    }

    return this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.FAILED,
        retryCount,
        rejectionReason: lastError?.message ?? "Transfer failed.",
        completedAt: new Date(),
      },
    });
  }

  async resumeStuckTransfer(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { aiSession: true },
    });

    if (!transaction || transaction.stellarTransactionHash) {
      return transaction;
    }

    if (transaction.status === TransactionStatus.SUBMITTING) {
      return this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          rejectionReason: STUCK_SUBMITTING_MESSAGE,
          completedAt: new Date(),
        },
      });
    }

    if (transaction.status !== TransactionStatus.SIGNING) {
      return transaction;
    }

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.APPROVED },
    });

    return this.submitTransfer(transactionId);
  }

  private async recordSpend(
    tx: Prisma.TransactionClient,
    transaction: {
      userId: string;
      aiSessionId: string;
      smartAccountId: string;
      asset: string;
      amount: Prisma.Decimal | null;
    },
  ) {
    if (!transaction.amount) {
      return;
    }

    const now = new Date();
    const asset = transaction.asset.toUpperCase();
    const amount = transaction.amount;
    const periodYear = now.getUTCFullYear();
    const periodMonth = now.getUTCMonth() + 1;

    await tx.budgetUsage.upsert({
      where: {
        aiSessionId_periodType_periodStart_asset: {
          aiSessionId: transaction.aiSessionId,
          periodType: BudgetPeriodType.DAILY,
          periodStart: startOfUtcDay(now),
          asset,
        },
      },
      create: {
        aiSessionId: transaction.aiSessionId,
        smartAccountId: transaction.smartAccountId,
        periodType: BudgetPeriodType.DAILY,
        periodStart: startOfUtcDay(now),
        asset,
        spentAmount: amount,
      },
      update: { spentAmount: { increment: amount } },
    });

    await tx.budgetUsage.upsert({
      where: {
        aiSessionId_periodType_periodStart_asset: {
          aiSessionId: transaction.aiSessionId,
          periodType: BudgetPeriodType.MONTHLY,
          periodStart: startOfUtcMonth(now),
          asset,
        },
      },
      create: {
        aiSessionId: transaction.aiSessionId,
        smartAccountId: transaction.smartAccountId,
        periodType: BudgetPeriodType.MONTHLY,
        periodStart: startOfUtcMonth(now),
        asset,
        spentAmount: amount,
      },
      update: { spentAmount: { increment: amount } },
    });

    await tx.usageRecord.upsert({
      where: {
        userId_smartAccountId_aiSessionId_periodYear_periodMonth_asset: {
          userId: transaction.userId,
          smartAccountId: transaction.smartAccountId,
          aiSessionId: transaction.aiSessionId,
          periodYear,
          periodMonth,
          asset,
        },
      },
      create: {
        userId: transaction.userId,
        smartAccountId: transaction.smartAccountId,
        aiSessionId: transaction.aiSessionId,
        periodYear,
        periodMonth,
        asset,
        totalAmount: amount,
        transactionCount: 1,
      },
      update: {
        totalAmount: { increment: amount },
        transactionCount: { increment: 1 },
      },
    });
  }
}

export function createTransactionEngine(
  prisma: PrismaClient,
  config: Pay3Config,
  aiSessions: AiSessionManager,
): TransactionEngine {
  return new TransactionEngine(prisma, config, aiSessions);
}
