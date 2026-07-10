import {
  AuditActor,
  type PrismaClient,
} from "@pay3/database";
import type { Pay3Config } from "@pay3/shared";
import { buildAuthChallengeMessage } from "./challenge-message.js";
import { AuthError } from "./errors.js";
import { toPrismaNetwork } from "./network.js";
import { assertValidWalletAddress, verifyWalletSignature } from "./signature.js";
import {
  generateChallengeNonce,
  generateSessionToken,
  hashSessionToken,
} from "./tokens.js";
import type {
  AuthenticatedWalletContext,
  WalletAuthSession,
  WalletChallengeResponse,
} from "./types.js";
import { findOrCreateUserWallet } from "./wallet-account.js";

export type WalletAuthConfig = Pick<Pay3Config, "auth" | "stellar">;

export class WalletAuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: WalletAuthConfig,
  ) {}

  async createChallenge(walletAddress: string): Promise<WalletChallengeResponse> {
    const normalizedAddress = assertValidWalletAddress(walletAddress);
    const network = this.config.stellar.network;
    const prismaNetwork = toPrismaNetwork(network);
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + this.config.auth.challengeTtlMs);
    const nonce = generateChallengeNonce();
    const message = buildAuthChallengeMessage({
      walletAddress: normalizedAddress,
      network,
      nonce,
      issuedAt,
      expiresAt,
    });

    const existingWallet = await this.prisma.wallet.findUnique({
      where: {
        publicAddress_network: {
          publicAddress: normalizedAddress,
          network: prismaNetwork,
        },
      },
      select: { id: true },
    });

    await this.prisma.authChallenge.deleteMany({
      where: {
        walletAddress: normalizedAddress,
        network: prismaNetwork,
        consumedAt: null,
      },
    });

    const challenge = await this.prisma.authChallenge.create({
      data: {
        walletAddress: normalizedAddress,
        network: prismaNetwork,
        nonce,
        message,
        expiresAt,
        walletId: existingWallet?.id ?? null,
      },
    });

    return {
      challengeId: challenge.id,
      nonce: challenge.nonce,
      message: challenge.message,
      walletAddress: normalizedAddress,
      network,
      expiresAt: challenge.expiresAt.toISOString(),
    };
  }

  async verifyChallengeAndCreateSession(input: {
    walletAddress: string;
    nonce: string;
    signature: string;
    ipAddress?: string;
  }): Promise<WalletAuthSession> {
    const normalizedAddress = assertValidWalletAddress(input.walletAddress);
    const network = this.config.stellar.network;
    const prismaNetwork = toPrismaNetwork(network);

    const challenge = await this.prisma.authChallenge.findUnique({
      where: { nonce: input.nonce },
    });

    if (!challenge) {
      throw new AuthError("CHALLENGE_NOT_FOUND", "Authentication challenge not found.");
    }

    if (challenge.walletAddress !== normalizedAddress) {
      throw new AuthError(
        "CHALLENGE_WALLET_MISMATCH",
        "Challenge was issued for a different wallet address.",
      );
    }

    if (challenge.network !== prismaNetwork) {
      throw new AuthError(
        "CHALLENGE_WALLET_MISMATCH",
        "Challenge was issued for a different Stellar network.",
      );
    }

    if (challenge.consumedAt) {
      throw new AuthError(
        "CHALLENGE_CONSUMED",
        "Authentication challenge has already been used.",
      );
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new AuthError("CHALLENGE_EXPIRED", "Authentication challenge has expired.");
    }

    verifyWalletSignature({
      walletAddress: normalizedAddress,
      message: challenge.message,
      signature: input.signature,
    });

    const session = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.authChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new AuthError(
          "CHALLENGE_CONSUMED",
          "Authentication challenge is no longer valid.",
        );
      }

      const { userId, walletId } = await findOrCreateUserWallet(
        tx,
        normalizedAddress,
        network,
      );

      await tx.wallet.updateMany({
        where: { userId, isPrimary: true, id: { not: walletId } },
        data: { isPrimary: false },
      });

      await tx.wallet.update({
        where: { id: walletId },
        data: { isPrimary: true },
      });

      const sessionToken = generateSessionToken();
      const sessionTokenHash = hashSessionToken(
        sessionToken,
        this.config.auth.sessionSecret,
      );
      const expiresAt = new Date(Date.now() + this.config.auth.sessionMaxAgeMs);

      const walletSession = await tx.walletSession.create({
        data: {
          userId,
          walletId,
          sessionTokenHash,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "WALLET_AUTH_SUCCESS",
          actor: AuditActor.USER,
          details: {
            walletAddress: normalizedAddress,
            network,
            challengeId: challenge.id,
          },
          ipAddress: input.ipAddress ?? null,
        },
      });

      return {
        sessionToken,
        expiresAt,
        userId,
        walletId,
        walletSessionId: walletSession.id,
      };
    });

    return {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt.toISOString(),
      userId: session.userId,
      walletId: session.walletId,
      walletAddress: normalizedAddress,
      network,
    };
  }

  async validateSession(sessionToken: string): Promise<AuthenticatedWalletContext> {
    const sessionTokenHash = hashSessionToken(
      sessionToken,
      this.config.auth.sessionSecret,
    );

    const session = await this.prisma.walletSession.findUnique({
      where: { sessionTokenHash },
      include: {
        wallet: {
          select: {
            publicAddress: true,
            network: true,
          },
        },
      },
    });

    if (!session) {
      throw new AuthError("SESSION_INVALID", "Session is invalid.");
    }

    if (session.revokedAt) {
      throw new AuthError("SESSION_REVOKED", "Session has been revoked.");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AuthError("SESSION_EXPIRED", "Session has expired.");
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      walletId: session.walletId,
      walletAddress: session.wallet.publicAddress,
      network:
        session.wallet.network === "TESTNET" ? "testnet" : "public",
      expiresAt: session.expiresAt,
    };
  }

  async revokeSession(sessionToken: string): Promise<void> {
    const sessionTokenHash = hashSessionToken(
      sessionToken,
      this.config.auth.sessionSecret,
    );

    await this.prisma.walletSession.updateMany({
      where: {
        sessionTokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.walletSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    return result.count;
  }
}

export function createWalletAuthService(
  prisma: PrismaClient,
  config: WalletAuthConfig,
): WalletAuthService {
  return new WalletAuthService(prisma, config);
}
