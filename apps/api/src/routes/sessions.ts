import { Router } from "express";
import { prisma } from "@pay3/database";
import {
  buildSessionAuthMessage,
  computeExpiresAt,
  createMcpToken,
  createSessionKeypair,
  defaultSessionRules,
  isSessionActive,
  normalizeClientType,
  permissionSummary,
  type SessionCreateInput,
  type SessionPolicyRules,
} from "@pay3/session-manager";
import { encryptSecret } from "../crypto.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import {
  createChallenge,
  findChallengeByNonce,
  markChallengeUsed,
} from "../auth-store.js";
import { verifySep53Signature } from "../sep53.js";
import { randomBytes } from "node:crypto";
import { CHALLENGE_TTL_MS } from "@pay3/shared";

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

function parseRules(body: unknown): SessionPolicyRules {
  const defaults = defaultSessionRules();
  const b = (body ?? {}) as Record<string, unknown>;
  const allowedActions = Array.isArray(b.allowedActions)
    ? b.allowedActions.map(String)
    : defaults.allowedActions;

  return {
    durationHours: Math.min(
      168,
      Math.max(1, Number(b.durationHours ?? defaults.durationHours))
    ),
    dailyBudget: String(b.dailyBudget ?? defaults.dailyBudget),
    asset: String(b.asset ?? defaults.asset),
    perTxMax: String(b.perTxMax ?? defaults.perTxMax),
    approvalAbove: String(b.approvalAbove ?? defaults.approvalAbove),
    allowedActions,
    blockedNotes: Array.isArray(b.blockedNotes)
      ? b.blockedNotes.map(String)
      : defaults.blockedNotes,
  };
}

function toSessionView(s: {
  id: string;
  clientType: string;
  label?: string | null;
  sessionPublicKey?: string | null;
  status: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  policy: { name: string; rulesJson: unknown } | null;
}) {
  const active = isSessionActive(s);
  const expired =
    s.status === "active" && s.expiresAt && s.expiresAt <= new Date();
  return {
    id: s.id,
    clientType: s.clientType,
    label: s.label ?? null,
    sessionPublicKey: s.sessionPublicKey ?? null,
    status: s.revokedAt
      ? "revoked"
      : expired
        ? "expired"
        : active
          ? "active"
          : s.status,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    revokedAt: s.revokedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    policy: s.policy
      ? { name: s.policy.name, rules: s.policy.rulesJson }
      : null,
    active,
  };
}

sessionsRouter.get("/", async (req, res) => {
  const { userId } = req as AuthedRequest;
  const sessions = await prisma.aiSession.findMany({
    where: { userId },
    include: { policy: true },
    orderBy: { createdAt: "desc" },
  });

  // Mark expired in DB lazily
  const now = new Date();
  for (const s of sessions) {
    if (
      s.status === "active" &&
      !s.revokedAt &&
      s.expiresAt &&
      s.expiresAt <= now
    ) {
      await prisma.aiSession.update({
        where: { id: s.id },
        data: { status: "expired" },
      });
      s.status = "expired";
    }
  }

  res.json({ sessions: sessions.map(toSessionView) });
});

/** Preview permission summary without creating a session. */
sessionsRouter.post("/preview", async (req, res) => {
  const clientType = normalizeClientType(String(req.body?.clientType ?? "claude"));
  const rules = parseRules(req.body?.rules ?? req.body);
  const input: SessionCreateInput = {
    clientType,
    label: req.body?.label ? String(req.body.label) : undefined,
    rules,
  };
  const summary = permissionSummary(input);
  res.json({
    clientType,
    label: input.label ?? null,
    rules,
    ...summary,
  });
});

/**
 * Start authorize flow: returns nonce + message to sign with Freighter.
 * Does not create the session yet.
 */
sessionsRouter.post("/challenge", async (req, res) => {
  const { walletPublicKey } = req as AuthedRequest;
  const clientType = normalizeClientType(String(req.body?.clientType ?? "claude"));
  const rules = parseRules(req.body?.rules ?? req.body);
  const input: SessionCreateInput = {
    clientType,
    label: req.body?.label ? String(req.body.label) : undefined,
    rules,
  };

  const nonce = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await createChallenge(walletPublicKey, nonce, expiresAt);

  const message = buildSessionAuthMessage(input, nonce);
  const summary = permissionSummary(input);

  res.json({
    nonce,
    message,
    expiresAt: expiresAt.toISOString(),
    preview: { clientType, label: input.label ?? null, rules, ...summary },
  });
});

/**
 * Verify wallet signature and create session.
 * Returns mcpToken ONCE — never stored in plaintext.
 */
sessionsRouter.post("/", async (req, res) => {
  const { userId, walletPublicKey } = req as AuthedRequest;
  const signature = String(req.body?.signature ?? "").trim();
  const nonce = String(req.body?.nonce ?? "").trim();
  const clientType = normalizeClientType(String(req.body?.clientType ?? "claude"));
  const rules = parseRules(req.body?.rules ?? req.body);
  const label = req.body?.label ? String(req.body.label) : `${clientType} session`;

  if (!signature || !nonce) {
    res.status(400).json({ error: "signature and nonce required" });
    return;
  }

  const input: SessionCreateInput = { clientType, label, rules };
  const message = buildSessionAuthMessage(input, nonce);

  try {
    const challenge = await findChallengeByNonce(nonce);
    if (
      !challenge ||
      challenge.publicKey !== walletPublicKey ||
      challenge.usedAt ||
      challenge.expiresAt < new Date()
    ) {
      res.status(401).json({ error: "invalid or expired challenge" });
      return;
    }

    if (!verifySep53Signature(walletPublicKey, message, signature)) {
      res.status(401).json({ error: "signature verification failed" });
      return;
    }

    await markChallengeUsed(challenge.id, nonce);

    const { publicKey: sessionPublicKey, secret } = createSessionKeypair();
    const encryptedSessionKey = encryptSecret(secret);
    const { token: mcpToken, hash: mcpTokenHash } = createMcpToken();
    const now = new Date();
    const expiresAt = computeExpiresAt(now, rules.durationHours);

    const policy = await prisma.policy.create({
      data: {
        userId,
        name: `${clientType}-${now.toISOString().slice(0, 10)}`,
        rulesJson: rules,
      },
    });

    const session = await prisma.aiSession.create({
      data: {
        userId,
        policyId: policy.id,
        clientType,
        label,
        sessionPublicKey,
        encryptedSessionKey,
        mcpTokenHash,
        status: "active",
        expiresAt,
      },
      include: { policy: true },
    });

    // Never return encryptedSessionKey or secret
    res.status(201).json({
      session: toSessionView(session),
      mcpToken,
      mcpConfigHint: {
        note: "Copy this token now — it is shown only once. Paste into your MCP client config later.",
      },
    });
  } catch (err) {
    console.error("sessions create failed:", err);
    res.status(500).json({ error: "failed to create session" });
  }
});

sessionsRouter.post("/revoke-all", async (req, res) => {
  const { userId } = req as AuthedRequest;
  const result = await prisma.aiSession.updateMany({
    where: { userId, status: "active", revokedAt: null },
    data: { status: "revoked", revokedAt: new Date() },
  });
  res.json({ revoked: result.count });
});

sessionsRouter.post("/:id/revoke", async (req, res) => {
  const { userId } = req as unknown as AuthedRequest;
  const id = String(req.params.id);

  const session = await prisma.aiSession.findFirst({
    where: { id, userId },
  });
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }

  const updated = await prisma.aiSession.update({
    where: { id },
    data: { status: "revoked", revokedAt: new Date() },
    include: { policy: true },
  });

  res.json({ session: toSessionView(updated) });
});
