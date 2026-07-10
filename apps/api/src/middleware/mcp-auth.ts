import type { NextFunction, Request, Response } from "express";
import { prisma } from "@pay3/database";
import { hashMcpToken, isSessionActive } from "@pay3/session-manager";

export type McpAuthedRequest = Request & {
  userId: string;
  sessionId: string;
  walletPublicKey: string;
};

export async function requireMcpAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : String(req.headers["x-pay3-mcp-token"] ?? "").trim();

  if (!token) {
    res.status(401).json({ error: "MCP token required (Bearer)" });
    return;
  }

  const mcpTokenHash = hashMcpToken(token);
  const session = await prisma.aiSession.findFirst({
    where: { mcpTokenHash },
    include: { user: { include: { wallet: true } } },
  });

  if (!session?.user?.wallet) {
    res.status(401).json({ error: "invalid MCP token" });
    return;
  }

  // Lazy expire
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

  if (!isSessionActive(session)) {
    res.status(403).json({ error: "session inactive, expired, or revoked" });
    return;
  }

  (req as McpAuthedRequest).userId = session.userId;
  (req as McpAuthedRequest).sessionId = session.id;
  (req as McpAuthedRequest).walletPublicKey = session.user.wallet.publicKey;
  next();
}
