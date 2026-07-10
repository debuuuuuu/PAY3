import { ApprovalStatus, TransactionStatus } from "@pay3/database";
import type { ServiceContext } from "./context.js";

export class ApprovalAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async listPendingApprovals(userId: string) {
    return this.ctx.prisma.approvalRequest.findMany({
      where: {
        userId,
        status: ApprovalStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        transaction: true,
        aiSession: { select: { id: true, clientType: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveTransaction(userId: string, transactionId: string, walletSignature?: string) {
    const approval = await this.ctx.prisma.approvalRequest.findFirst({
      where: {
        userId,
        transactionId,
        status: ApprovalStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (!approval) {
      throw new Error("Pending approval not found or expired.");
    }

    await this.ctx.prisma.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id: approval.id },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedAt: new Date(),
          approvalWalletSignature: walletSignature ?? null,
        },
      });
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.APPROVED },
      });
    });

    return this.ctx.transactions.submitTransfer(transactionId);
  }
}
