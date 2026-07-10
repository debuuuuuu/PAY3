import type { AiClientType } from "@pay3/database";
import type { ServiceContext } from "./context.js";

export class AiSessionAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async createSession(input: {
    userId: string;
    smartAccountId: string;
    policyId: string;
    clientType: AiClientType;
    authorizationTxHash?: string;
  }) {
    const result = await this.ctx.aiSessions.createSession(input);
    const smartAccount = await this.ctx.prisma.smartAccount.findFirst({
      where: { id: input.smartAccountId, userId: input.userId },
    });
    const policy = await this.ctx.prisma.policy.findFirst({
      where: { id: input.policyId, userId: input.userId },
    });

    return {
      ...result,
      onChainRegistration: smartAccount?.contractId
        ? {
            contractId: smartAccount.contractId,
            method: "add_session",
            sessionPublicKey: result.sessionPublicKey,
            expiresAtUnix: Math.floor(new Date(result.expiresAt).getTime() / 1000),
            perTxMax: policy?.perTransactionMax.toString() ?? "0",
            dailyMax: policy?.dailyBudget.toString() ?? "0",
            usdcSacContractId: this.ctx.config.stellar.usdcSacContractId,
            note: "Sign add_session with the owner wallet (Freighter or stellar CLI) before MCP transfers.",
          }
        : null,
    };
  }

  listActiveSessions(userId: string) {
    return this.ctx.aiSessions.listActiveSessions(userId);
  }

  revokeSession(userId: string, sessionId: string) {
    return this.ctx.aiSessions.revokeSession(userId, sessionId);
  }

  revokeAllSessions(userId: string) {
    return this.ctx.aiSessions.revokeAllSessions(userId);
  }
}
