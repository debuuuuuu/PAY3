import type { AiClientType } from "@pay3/database";
import type { ServiceContext } from "./context.js";

export class AiSessionAppService {
  constructor(private readonly ctx: ServiceContext) {}

  createSession(input: {
    userId: string;
    smartAccountId: string;
    policyId: string;
    clientType: AiClientType;
    authorizationTxHash?: string;
  }) {
    return this.ctx.aiSessions.createSession(input);
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
