import type { PolicySnapshot } from "@pay3/database";
import { assertBalanceReadAllowed, assertHistoryReadAllowed } from "@pay3/policy-engine";
import { getAssetBalance } from "@pay3/stellar";
import type { ServiceContext } from "./context.js";

export class TransferAppService {
  constructor(private readonly ctx: ServiceContext) {}

  private async getMcpSession(mcpToken: string) {
    return this.ctx.aiSessions.authenticateMcpToken(mcpToken);
  }

  async getBalanceForMcp(mcpToken: string, asset: string) {
    const session = await this.getMcpSession(mcpToken);
    const snapshot = session.policySnapshot as PolicySnapshot;
    assertBalanceReadAllowed(snapshot);

    const balance = await getAssetBalance(
      this.ctx.stellar,
      session.sessionPublicKey,
      asset,
    );

    return {
      asset: asset.toUpperCase(),
      balance,
      sessionId: session.id,
      smartAccountId: session.smartAccountId,
    };
  }

  async transferForMcp(input: {
    mcpToken: string;
    idempotencyKey: string;
    recipient: string;
    asset: string;
    amount: string;
  }) {
    const session = await this.getMcpSession(input.mcpToken);
    const snapshot = session.policySnapshot as PolicySnapshot;

    return this.ctx.transactions.executeTransfer({
      aiSessionId: session.id,
      userId: session.userId,
      smartAccountId: session.smartAccountId,
      idempotencyKey: input.idempotencyKey,
      recipientInput: input.recipient,
      asset: input.asset,
      amount: input.amount,
      policySnapshot: snapshot,
    });
  }

  async getTransactionHistoryForMcp(mcpToken: string, limit = 20) {
    const session = await this.getMcpSession(mcpToken);
    const snapshot = session.policySnapshot as PolicySnapshot;
    assertHistoryReadAllowed(snapshot);

    return this.ctx.prisma.transaction.findMany({
      where: { aiSessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        asset: true,
        amount: true,
        recipientInput: true,
        recipientAddress: true,
        status: true,
        policyDecision: true,
        stellarTransactionHash: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }
}
