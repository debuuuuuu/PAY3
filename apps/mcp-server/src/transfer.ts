import type { PolicySnapshot } from "@pay3/database";
import type { PrismaClient } from "@pay3/database";
import { assertBalanceReadAllowed, assertHistoryReadAllowed } from "@pay3/policy-engine";
import type { AiSessionManager } from "@pay3/session-manager";
import { getAssetBalance, type StellarClient } from "@pay3/stellar";
import type { TransactionEngine } from "@pay3/transaction-engine";

export interface McpTransferDeps {
  prisma: PrismaClient;
  stellar: StellarClient;
  aiSessions: AiSessionManager;
  transactions: TransactionEngine;
}

export class McpTransferService {
  constructor(private readonly deps: McpTransferDeps) {}

  private async getSession(mcpToken: string) {
    return this.deps.aiSessions.authenticateMcpToken(mcpToken);
  }

  async getBalance(mcpToken: string, asset: string) {
    const session = await this.getSession(mcpToken);
    const snapshot = session.policySnapshot as PolicySnapshot;
    assertBalanceReadAllowed(snapshot);

    const balance = await getAssetBalance(
      this.deps.stellar,
      session.sessionPublicKey,
      asset,
    );

    return {
      asset: asset.toUpperCase(),
      balance,
      sessionId: session.id,
      smartAccountId: session.smartAccountId,
    };
  }

  async transfer(input: {
    mcpToken: string;
    idempotencyKey: string;
    recipient: string;
    asset: string;
    amount: string;
  }) {
    const session = await this.getSession(input.mcpToken);
    const snapshot = session.policySnapshot as PolicySnapshot;

    return this.deps.transactions.executeTransfer({
      aiSessionId: session.id,
      userId: session.userId,
      smartAccountId: session.smartAccountId,
      idempotencyKey: input.idempotencyKey,
      recipientInput: input.recipient,
      asset: input.asset,
      amount: input.amount,
      policySnapshot: snapshot,
    });
  }

  async getTransactionHistory(mcpToken: string, limit = 20) {
    const session = await this.getSession(mcpToken);
    const snapshot = session.policySnapshot as PolicySnapshot;
    assertHistoryReadAllowed(snapshot);

    return this.deps.prisma.transaction.findMany({
      where: { aiSessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        asset: true,
        amount: true,
        recipientInput: true,
        recipientAddress: true,
        status: true,
        policyDecision: true,
        rejectionReason: true,
        stellarTransactionHash: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }
}
