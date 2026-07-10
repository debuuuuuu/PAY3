import { randomUUID } from "node:crypto";
import { prisma } from "@pay3/database";
import { APPROVAL_TTL_MS } from "@pay3/shared";
import { evaluatePolicy } from "@pay3/policy-engine";
import { resolveRecipient } from "@pay3/recipient-resolver";
import {
  isSessionActive,
  type SessionPolicyRules,
} from "@pay3/session-manager";
import {
  canRetrySubmit,
  nextRetryCount,
} from "@pay3/transaction-engine";
import {
  isTechnicalSubmitError,
  submitNativePayment,
} from "@pay3/stellar";
import { decryptSecret } from "./crypto.js";

function asRules(json: unknown): SessionPolicyRules | null {
  if (!json || typeof json !== "object") return null;
  const r = json as Record<string, unknown>;
  if (
    typeof r.durationHours !== "number" ||
    typeof r.dailyBudget !== "string" ||
    typeof r.asset !== "string" ||
    typeof r.perTxMax !== "string" ||
    typeof r.approvalAbove !== "string" ||
    !Array.isArray(r.allowedActions)
  ) {
    return null;
  }
  return {
    durationHours: r.durationHours,
    dailyBudget: r.dailyBudget,
    asset: r.asset,
    perTxMax: r.perTxMax,
    approvalAbove: r.approvalAbove,
    allowedActions: r.allowedActions.map(String),
    blockedNotes: Array.isArray(r.blockedNotes)
      ? r.blockedNotes.map(String)
      : [],
  };
}

export function toTxView(t: {
  id: string;
  sessionId: string | null;
  action: string;
  asset: string | null;
  amount: string | null;
  recipient: string | null;
  policyDecision: string | null;
  status: string;
  stellarTransactionHash: string | null;
  retryCount: number;
  idempotencyKey: string | null;
  createdAt: Date;
  completedAt: Date | null;
}) {
  return {
    id: t.id,
    sessionId: t.sessionId,
    action: t.action,
    asset: t.asset,
    amount: t.amount,
    recipient: t.recipient,
    policyDecision: t.policyDecision,
    status: t.status,
    stellarTransactionHash: t.stellarTransactionHash,
    retryCount: t.retryCount,
    idempotencyKey: t.idempotencyKey,
    createdAt: t.createdAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
  };
}

async function spentToday(sessionId: string, asset: string): Promise<string> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const txs = await prisma.transaction.findMany({
    where: {
      sessionId,
      action: "transfer",
      status: "SUCCESS",
      createdAt: { gte: start },
      asset: { equals: asset, mode: "insensitive" },
    },
    select: { amount: true },
  });
  let total = 0;
  for (const t of txs) {
    const n = Number(t.amount ?? 0);
    if (Number.isFinite(n)) total += n;
  }
  return String(total);
}

async function writeAudit(
  userId: string,
  action: string,
  metadata: object
) {
  await prisma.auditLog.create({
    data: { userId, action, metadata },
  });
}

async function submitWithRetry(
  txId: string,
  secret: string,
  destination: string,
  amount: string,
  startRetryCount: number
): Promise<{ hash: string; retryCount: number }> {
  let retryCount = startRetryCount;
  // First attempt + up to MAX additional technical retries
  for (;;) {
    await prisma.transaction.update({
      where: { id: txId },
      data: { status: "SUBMITTING", retryCount },
    });
    try {
      const { hash } = await submitNativePayment({
        secret,
        destination,
        amount,
      });
      return { hash, retryCount };
    } catch (err) {
      if (!isTechnicalSubmitError(err) || !canRetrySubmit(retryCount)) {
        throw err;
      }
      retryCount = nextRetryCount(retryCount);
    }
  }
}

export type TransferInput = {
  userId: string;
  sessionId: string;
  recipient: string;
  asset: string;
  amount: string;
  idempotencyKey?: string;
};

/**
 * Full transfer lifecycle: resolve → policy → approve/auto → sign → submit.
 * ponytail: signs with allocation-account secret until Soroban session keys land.
 */
export async function executeTransfer(input: TransferInput) {
  const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();

  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return { transaction: toTxView(existing), idempotentReplay: true };
  }

  const session = await prisma.aiSession.findFirst({
    where: { id: input.sessionId, userId: input.userId },
    include: { policy: true },
  });
  if (!session) {
    throw Object.assign(new Error("session not found"), { status: 404 });
  }

  if (
    session.status === "active" &&
    session.expiresAt &&
    session.expiresAt <= new Date() &&
    !session.revokedAt
  ) {
    await prisma.aiSession.update({
      where: { id: session.id },
      data: { status: "expired" },
    });
    session.status = "expired";
  }

  const smartAccount = await prisma.smartAccount.findUnique({
    where: { userId: input.userId },
  });
  if (!smartAccount?.publicKey || !smartAccount.encryptedSecret) {
    throw Object.assign(new Error("smart account not linked"), { status: 400 });
  }

  const contacts = await prisma.contact.findMany({
    where: { userId: input.userId },
  });
  const resolved = resolveRecipient(
    input.recipient,
    contacts.map((c) => ({
      id: c.id,
      name: c.name,
      stellarAddress: c.stellarAddress,
      verified: c.verified,
    }))
  );
  if (!resolved.ok) {
    throw Object.assign(new Error(resolved.message), {
      status: resolved.reason === "ambiguous" ? 409 : 400,
      resolve: resolved,
    });
  }

  let tx = await prisma.transaction.create({
    data: {
      userId: input.userId,
      sessionId: session.id,
      idempotencyKey,
      action: "transfer",
      asset: input.asset,
      amount: input.amount,
      recipient: resolved.stellarAddress,
      status: "CREATED",
    },
  });

  await prisma.idempotencyRecord.create({
    data: { key: idempotencyKey, transactionId: tx.id },
  });

  tx = await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "VALIDATING" },
  });

  const rules = asRules(session.policy?.rulesJson);
  if (!rules) {
    tx = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: "REJECTED",
        policyDecision: "REJECTED",
        completedAt: new Date(),
      },
    });
    throw Object.assign(new Error("session has no usable policy"), {
      status: 400,
      transaction: toTxView(tx),
    });
  }

  const spent = await spentToday(session.id, input.asset);
  const policy = evaluatePolicy(
    {
      action: "transfer",
      asset: input.asset,
      amount: input.amount,
      recipient: resolved.stellarAddress,
    },
    {
      rules,
      sessionActive: isSessionActive(session),
      spentToday: spent,
    }
  );

  if (policy.decision === "REJECTED") {
    tx = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: "REJECTED",
        policyDecision: "REJECTED",
        completedAt: new Date(),
      },
    });
    await writeAudit(input.userId, "transfer_rejected", {
      transactionId: tx.id,
      reason: policy.reason,
    });
    return { transaction: toTxView(tx), policy, idempotentReplay: false };
  }

  if (policy.decision === "PENDING_APPROVAL") {
    tx = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: "PENDING_APPROVAL",
        policyDecision: "PENDING_APPROVAL",
      },
    });
    const approval = await prisma.approvalRequest.create({
      data: {
        userId: input.userId,
        transactionId: tx.id,
        status: "pending",
        expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
      },
    });
    await writeAudit(input.userId, "transfer_pending_approval", {
      transactionId: tx.id,
      approvalId: approval.id,
    });
    return {
      transaction: toTxView(tx),
      policy,
      approval: {
        id: approval.id,
        expiresAt: approval.expiresAt.toISOString(),
      },
      idempotentReplay: false,
    };
  }

  // AUTO_EXECUTE
  tx = await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      status: "AUTO_APPROVED",
      policyDecision: "AUTO_EXECUTE",
    },
  });

  return finalizeAndSubmit(tx.id, smartAccount.encryptedSecret, {
    destination: resolved.stellarAddress,
    amount: input.amount,
    userId: input.userId,
  });
}

export async function finalizeAndSubmit(
  transactionId: string,
  encryptedSecret: string,
  opts: { destination: string; amount: string; userId: string }
) {
  let tx = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "SIGNING" },
  });

  let secret: string;
  try {
    secret = decryptSecret(encryptedSecret);
  } catch {
    tx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw Object.assign(new Error("failed to unlock allocation account"), {
      status: 500,
      transaction: toTxView(tx),
    });
  }

  try {
    const { hash, retryCount } = await submitWithRetry(
      transactionId,
      secret,
      opts.destination,
      opts.amount,
      tx.retryCount
    );
    tx = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "SUCCESS",
        stellarTransactionHash: hash,
        retryCount,
        completedAt: new Date(),
      },
    });
    await writeAudit(opts.userId, "transfer_success", {
      transactionId: tx.id,
      hash,
    });
    return {
      transaction: toTxView(tx),
      policy: { decision: "AUTO_EXECUTE" as const },
      idempotentReplay: false,
    };
  } catch (err) {
    tx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED", completedAt: new Date() },
    });
    await writeAudit(opts.userId, "transfer_failed", {
      transactionId: tx.id,
      error: err instanceof Error ? err.message : "submit failed",
    });
    throw Object.assign(
      new Error(err instanceof Error ? err.message : "submit failed"),
      { status: 502, transaction: toTxView(tx) }
    );
  }
}

export async function approvePendingTransfer(
  userId: string,
  approvalId: string
) {
  const approval = await prisma.approvalRequest.findFirst({
    where: { id: approvalId, userId },
  });
  if (!approval?.transactionId) {
    throw Object.assign(new Error("approval not found"), { status: 404 });
  }
  if (approval.status !== "pending") {
    throw Object.assign(new Error("approval already resolved"), { status: 409 });
  }
  if (approval.expiresAt <= new Date()) {
    await prisma.approvalRequest.update({
      where: { id: approval.id },
      data: { status: "expired", resolvedAt: new Date() },
    });
    await prisma.transaction.update({
      where: { id: approval.transactionId },
      data: { status: "EXPIRED", completedAt: new Date() },
    });
    throw Object.assign(new Error("approval expired"), { status: 410 });
  }

  const tx = await prisma.transaction.findFirst({
    where: { id: approval.transactionId, userId },
  });
  if (!tx || tx.status !== "PENDING_APPROVAL") {
    throw Object.assign(new Error("transaction not pending approval"), {
      status: 409,
    });
  }

  const smartAccount = await prisma.smartAccount.findUnique({
    where: { userId },
  });
  if (!smartAccount?.encryptedSecret || !tx.recipient || !tx.amount) {
    throw Object.assign(new Error("cannot execute transfer"), { status: 400 });
  }

  await prisma.approvalRequest.update({
    where: { id: approval.id },
    data: { status: "approved", resolvedAt: new Date() },
  });
  await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "AUTO_APPROVED", policyDecision: "PENDING_APPROVAL→APPROVED" },
  });

  return finalizeAndSubmit(tx.id, smartAccount.encryptedSecret, {
    destination: tx.recipient,
    amount: tx.amount,
    userId,
  });
}

export async function rejectPendingTransfer(
  userId: string,
  approvalId: string
) {
  const approval = await prisma.approvalRequest.findFirst({
    where: { id: approvalId, userId },
  });
  if (!approval?.transactionId) {
    throw Object.assign(new Error("approval not found"), { status: 404 });
  }
  if (approval.status !== "pending") {
    throw Object.assign(new Error("approval already resolved"), { status: 409 });
  }

  await prisma.approvalRequest.update({
    where: { id: approval.id },
    data: { status: "rejected", resolvedAt: new Date() },
  });
  const tx = await prisma.transaction.update({
    where: { id: approval.transactionId },
    data: { status: "CANCELLED", completedAt: new Date() },
  });
  await writeAudit(userId, "transfer_approval_rejected", {
    transactionId: tx.id,
    approvalId,
  });
  return { transaction: toTxView(tx) };
}
