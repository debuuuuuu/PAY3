import { Router } from "express";
import { prisma } from "@pay3/database";
import { evaluatePolicy } from "@pay3/policy-engine";
import { isSessionActive, type SessionPolicyRules } from "@pay3/session-manager";
import { getAccountBalances, getAccountPayments } from "@pay3/stellar";
import { requireMcpAuth, type McpAuthedRequest } from "../middleware/mcp-auth.js";
import { executeTransfer, toTxView } from "../transfer-service.js";

export const mcpRouter = Router();

mcpRouter.use(requireMcpAuth);

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

mcpRouter.get("/balance", async (req, res) => {
  const { userId, sessionId } = req as McpAuthedRequest;

  const session = await prisma.aiSession.findFirst({
    where: { id: sessionId, userId },
    include: { policy: true },
  });
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }

  const rules = asRules(session.policy?.rulesJson);
  if (!rules) {
    res.status(400).json({ error: "session has no policy" });
    return;
  }

  const policy = evaluatePolicy(
    { action: "get_balance" },
    { rules, sessionActive: isSessionActive(session) }
  );
  if (policy.decision === "REJECTED") {
    res.status(403).json({ error: policy.reason, policy });
    return;
  }

  const smartAccount = await prisma.smartAccount.findUnique({
    where: { userId },
  });
  if (!smartAccount?.publicKey) {
    res.status(400).json({ error: "smart account not linked" });
    return;
  }

  const balances = await getAccountBalances(smartAccount.publicKey);
  const assetFilter = req.query.asset
    ? String(req.query.asset).toUpperCase()
    : null;
  const filtered = assetFilter
    ? balances.filter((b) => b.asset.toUpperCase().startsWith(assetFilter))
    : balances;

  res.json({
    publicKey: smartAccount.publicKey,
    balances: filtered,
    policy: policy.decision,
  });
});

mcpRouter.post("/transfer", async (req, res) => {
  const { userId, sessionId } = req as McpAuthedRequest;
  const recipient = String(req.body?.recipient ?? "").trim();
  const asset = String(req.body?.asset ?? "XLM").trim();
  const amount = String(req.body?.amount ?? "").trim();
  const idempotencyKey = req.body?.idempotencyKey
    ? String(req.body.idempotencyKey).trim()
    : undefined;

  if (!recipient || !amount) {
    res.status(400).json({ error: "recipient and amount required" });
    return;
  }

  try {
    const result = await executeTransfer({
      userId,
      sessionId,
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
    res.status(status).json(result);
  } catch (err: unknown) {
    const e = err as {
      status?: number;
      message?: string;
      transaction?: unknown;
      resolve?: unknown;
    };
    res.status(e.status ?? 500).json({
      error: e.message ?? "transfer failed",
      transaction: e.transaction,
      resolve: e.resolve,
    });
  }
});

mcpRouter.get("/history", async (req, res) => {
  const { userId, sessionId } = req as McpAuthedRequest;

  const session = await prisma.aiSession.findFirst({
    where: { id: sessionId, userId },
    include: { policy: true },
  });
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }

  const rules = asRules(session.policy?.rulesJson);
  if (!rules) {
    res.status(400).json({ error: "session has no policy" });
    return;
  }

  const policy = evaluatePolicy(
    { action: "get_transaction_history" },
    { rules, sessionActive: isSessionActive(session) }
  );
  if (policy.decision === "REJECTED") {
    res.status(403).json({ error: policy.reason, policy });
    return;
  }

  const txs = await prisma.transaction.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const smartAccount = await prisma.smartAccount.findUnique({
    where: { userId },
  });
  let horizon: unknown[] = [];
  if (smartAccount?.publicKey) {
    horizon = await getAccountPayments(smartAccount.publicKey, 15);
  }

  res.json({
    transactions: txs.map(toTxView),
    horizon,
    policy: policy.decision,
  });
});
