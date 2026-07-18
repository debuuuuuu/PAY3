/**
 * Shared MCP tool implementations (REST + Streamable HTTP).
 */
import { prisma } from "@pay3/database";
import { evaluatePolicy } from "@pay3/policy-engine";
import { isSessionActive, type SessionPolicyRules } from "@pay3/session-manager";
import { getAccountBalances, getAccountPayments } from "@pay3/stellar";
import { executeTransfer, toTxView } from "./transfer-service.js";

export type McpSessionCtx = {
  userId: string;
  sessionId: string;
};

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

export type McpToolResult = {
  status: number;
  body: unknown;
};

export async function mcpGetBalance(
  ctx: McpSessionCtx,
  assetFilter?: string | null
): Promise<McpToolResult> {
  const session = await prisma.aiSession.findFirst({
    where: { id: ctx.sessionId, userId: ctx.userId },
    include: { policy: true },
  });
  if (!session) return { status: 404, body: { error: "session not found" } };

  const rules = asRules(session.policy?.rulesJson);
  if (!rules) return { status: 400, body: { error: "session has no policy" } };

  const policy = evaluatePolicy(
    { action: "get_balance" },
    { rules, sessionActive: isSessionActive(session) }
  );
  if (policy.decision === "REJECTED") {
    return { status: 403, body: { error: policy.reason, policy } };
  }

  const smartAccount = await prisma.smartAccount.findUnique({
    where: { userId: ctx.userId },
  });
  if (!smartAccount?.publicKey) {
    return { status: 400, body: { error: "smart account not linked" } };
  }

  const balances = await getAccountBalances(smartAccount.publicKey);
  const filter = assetFilter ? assetFilter.toUpperCase() : null;
  const filtered = filter
    ? balances.filter((b) => b.asset.toUpperCase().startsWith(filter))
    : balances;

  return {
    status: 200,
    body: {
      publicKey: smartAccount.publicKey,
      balances: filtered,
      policy: policy.decision,
    },
  };
}

export async function mcpTransfer(
  ctx: McpSessionCtx,
  args: {
    recipient: string;
    asset?: string;
    amount: string;
    idempotencyKey?: string;
  }
): Promise<McpToolResult> {
  const recipient = String(args.recipient ?? "").trim();
  const asset = String(args.asset ?? "XLM").trim();
  const amount = String(args.amount ?? "").trim();
  const idempotencyKey = args.idempotencyKey
    ? String(args.idempotencyKey).trim()
    : undefined;

  if (!recipient || !amount) {
    return { status: 400, body: { error: "recipient and amount required" } };
  }

  try {
    const result = await executeTransfer({
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      recipient,
      asset,
      amount,
      idempotencyKey,
    });
    const status =
      result.transaction.status === "PENDING_APPROVAL"
        ? 202
        : result.transaction.status === "REJECTED"
          ? 403
          : result.transaction.status === "SUCCESS"
            ? 200
            : 201;
    return { status, body: result };
  } catch (err: unknown) {
    const e = err as {
      status?: number;
      message?: string;
      transaction?: unknown;
      resolve?: unknown;
    };
    return {
      status: e.status ?? 500,
      body: {
        error: e.message ?? "transfer failed",
        transaction: e.transaction,
        resolve: e.resolve,
      },
    };
  }
}

export async function mcpGetHistory(ctx: McpSessionCtx): Promise<McpToolResult> {
  const session = await prisma.aiSession.findFirst({
    where: { id: ctx.sessionId, userId: ctx.userId },
    include: { policy: true },
  });
  if (!session) return { status: 404, body: { error: "session not found" } };

  const rules = asRules(session.policy?.rulesJson);
  if (!rules) return { status: 400, body: { error: "session has no policy" } };

  const policy = evaluatePolicy(
    { action: "get_transaction_history" },
    { rules, sessionActive: isSessionActive(session) }
  );
  if (policy.decision === "REJECTED") {
    return { status: 403, body: { error: policy.reason, policy } };
  }

  const txs = await prisma.transaction.findMany({
    where: { userId: ctx.userId, sessionId: ctx.sessionId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const smartAccount = await prisma.smartAccount.findUnique({
    where: { userId: ctx.userId },
  });
  let horizon: unknown[] = [];
  if (smartAccount?.publicKey) {
    horizon = await getAccountPayments(smartAccount.publicKey, 15);
  }

  return {
    status: 200,
    body: {
      transactions: txs.map(toTxView),
      horizon,
      policy: policy.decision,
    },
  };
}
