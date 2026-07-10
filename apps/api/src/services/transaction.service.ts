import type { ServiceContext } from "./context.js";

export class TransactionAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async listTransactions(userId: string, limit = 50) {
    return this.ctx.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        aiSession: { select: { id: true, clientType: true } },
        contact: { select: { id: true, displayName: true } },
      },
    });
  }

  async getTransaction(userId: string, transactionId: string) {
    return this.ctx.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        aiSession: { select: { id: true, clientType: true } },
        approvalRequest: true,
      },
    });
  }
}
