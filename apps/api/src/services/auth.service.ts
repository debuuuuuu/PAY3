import type { WalletChallengeResponse, WalletAuthSession } from "@pay3/auth";
import type { Response } from "express";
import type { ServiceContext } from "./context.js";
import { getSessionCookieOptions } from "../middleware/session-token.js";

export class AuthAppService {
  constructor(private readonly ctx: ServiceContext) {}

  createChallenge(walletAddress: string): Promise<WalletChallengeResponse> {
    return this.ctx.walletAuth.createChallenge(walletAddress);
  }

  async verifyChallenge(input: {
    walletAddress: string;
    nonce: string;
    signature: string;
    ipAddress?: string;
  }): Promise<WalletAuthSession> {
    return this.ctx.walletAuth.verifyChallengeAndCreateSession(input);
  }

  setSessionCookie(res: Response, sessionToken: string): void {
    res.cookie(
      this.ctx.config.auth.sessionCookieName,
      sessionToken,
      getSessionCookieOptions(this.ctx.config),
    );
  }

  clearSessionCookie(res: Response): void {
    res.clearCookie(this.ctx.config.auth.sessionCookieName, {
      path: "/",
    });
  }

  async logout(sessionToken: string): Promise<void> {
    await this.ctx.walletAuth.revokeSession(sessionToken);
  }
}
