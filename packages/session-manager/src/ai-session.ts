import { createHash, randomBytes } from "node:crypto";
import {
  AiClientType,
  AiSessionStatus,
  type PrismaClient,
} from "@pay3/database";
import { buildPolicySnapshot } from "@pay3/database";
import type { Pay3Config } from "@pay3/shared";
import { Keypair } from "@stellar/stellar-sdk";
import { decryptSecret, encryptSecret } from "./encryption.js";
import { SessionManagerError } from "./errors.js";

export function hashMcpToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateMcpAuthToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface CreateAiSessionInput {
  userId: string;
  smartAccountId: string;
  policyId: string;
  clientType: AiClientType;
  authorizationTxHash?: string;
}

export interface CreateAiSessionResult {
  sessionId: string;
  mcpAuthToken: string;
  sessionPublicKey: string;
  expiresAt: string;
}

export class AiSessionManager {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: Pick<Pay3Config, "auth" | "sessionKeys" | "stellar">,
  ) {}

  async createSession(input: CreateAiSessionInput): Promise<CreateAiSessionResult> {
    const policy = await this.prisma.policy.findFirst({
      where: { id: input.policyId, userId: input.userId, isActive: true },
    });
    if (!policy) {
      throw new SessionManagerError("SESSION_NOT_FOUND", "Policy not found for user.");
    }

    const smartAccount = await this.prisma.smartAccount.findFirst({
      where: { id: input.smartAccountId, userId: input.userId },
    });
    if (!smartAccount) {
      throw new SessionManagerError("SESSION_NOT_FOUND", "Smart account not found for user.");
    }

    const keypair = Keypair.random();
    const mcpAuthToken = generateMcpAuthToken();
    const expiresAt = new Date(
      Date.now() + policy.sessionDurationHours * 60 * 60 * 1000,
    );

    const session = await this.prisma.aiSession.create({
      data: {
        userId: input.userId,
        smartAccountId: input.smartAccountId,
        policyId: policy.id,
        clientType: input.clientType,
        sessionPublicKey: keypair.publicKey(),
        encryptedSessionKey: encryptSecret(
          keypair.secret(),
          this.config.sessionKeys.encryptionKey,
        ),
        mcpAuthTokenHash: hashMcpToken(mcpAuthToken),
        policySnapshot: buildPolicySnapshot(policy),
        expiresAt,
        authorizedAt: new Date(),
        authorizationTxHash: input.authorizationTxHash ?? null,
        status: AiSessionStatus.ACTIVE,
      },
    });

    return {
      sessionId: session.id,
      mcpAuthToken,
      sessionPublicKey: session.sessionPublicKey,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async authenticateMcpToken(token: string) {
    const session = await this.prisma.aiSession.findUnique({
      where: { mcpAuthTokenHash: hashMcpToken(token) },
      include: {
        smartAccount: true,
        policy: true,
      },
    });

    if (!session) {
      throw new SessionManagerError("INVALID_MCP_TOKEN", "Invalid MCP session token.");
    }

    if (session.status === AiSessionStatus.REVOKED) {
      throw new SessionManagerError("SESSION_REVOKED", "AI session has been revoked.");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      if (session.status === AiSessionStatus.ACTIVE) {
        await this.prisma.aiSession.update({
          where: { id: session.id },
          data: { status: AiSessionStatus.EXPIRED },
        });
      }
      throw new SessionManagerError("SESSION_EXPIRED", "AI session has expired.");
    }

    if (session.status !== AiSessionStatus.ACTIVE) {
      throw new SessionManagerError("SESSION_INACTIVE", "AI session is not active.");
    }

    return session;
  }

  getSessionSignerSecret(encryptedSessionKey: string): string {
    return decryptSecret(encryptedSessionKey, this.config.sessionKeys.encryptionKey);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.aiSession.updateMany({
      where: { id: sessionId, userId, status: AiSessionStatus.ACTIVE },
      data: { status: AiSessionStatus.REVOKED, revokedAt: new Date() },
    });
    if (result.count === 0) {
      throw new SessionManagerError("SESSION_NOT_FOUND", "Active AI session not found.");
    }
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.prisma.aiSession.updateMany({
      where: { userId, status: AiSessionStatus.ACTIVE },
      data: { status: AiSessionStatus.REVOKED, revokedAt: new Date() },
    });
    return result.count;
  }

  async listActiveSessions(userId: string) {
    return this.prisma.aiSession.findMany({
      where: {
        userId,
        status: AiSessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientType: true,
        sessionPublicKey: true,
        expiresAt: true,
        createdAt: true,
        policy: { select: { id: true, name: true, preset: true } },
        smartAccount: { select: { id: true, contractId: true } },
      },
    });
  }
}

export function createAiSessionManager(
  prisma: PrismaClient,
  config: Pick<Pay3Config, "auth" | "sessionKeys" | "stellar">,
): AiSessionManager {
  return new AiSessionManager(prisma, config);
}
