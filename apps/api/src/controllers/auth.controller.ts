import type { Request, Response } from "express";
import { extractSessionToken } from "../middleware/session-token.js";
import { sendData } from "./response.js";
import { requireString } from "./validation.js";

export async function createChallenge(req: Request, res: Response): Promise<void> {
  const walletAddress = requireString(req.body?.walletAddress, "walletAddress");
  const challenge = await res.locals.services.auth.createChallenge(walletAddress);
  sendData(req, res, challenge);
}

export async function verifyChallenge(req: Request, res: Response): Promise<void> {
  const walletAddress = requireString(req.body?.walletAddress, "walletAddress");
  const nonce = requireString(req.body?.nonce, "nonce");
  const signature = requireString(req.body?.signature, "signature");

  const session = await res.locals.services.auth.verifyChallenge({
    walletAddress,
    nonce,
    signature,
    ipAddress: req.ip,
  });

  res.locals.services.auth.setSessionCookie(res, session.sessionToken);
  sendData(req, res, {
    userId: session.userId,
    walletId: session.walletId,
    walletAddress: session.walletAddress,
    network: session.network,
    expiresAt: session.expiresAt,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = extractSessionToken(req, res.locals.config.auth.sessionCookieName);
  if (token) {
    await res.locals.services.auth.logout(token);
  }
  res.locals.services.auth.clearSessionCookie(res);
  res.status(204).send();
}

export async function getMe(req: Request, res: Response): Promise<void> {
  sendData(req, res, {
    userId: req.auth!.userId,
    walletId: req.auth!.walletId,
    walletAddress: req.auth!.walletAddress,
    network: req.auth!.network,
    sessionExpiresAt: req.auth!.expiresAt.toISOString(),
  });
}
