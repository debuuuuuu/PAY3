import {
  ApprovalStatus,
  AuditActor,
  IdempotencyStatus,
  TransactionStatus,
  type PrismaClient,
} from "@pay3/database";
import { APPROVAL_EXPIRED_MESSAGE } from "./constants.js";

export async function expirePendingApprovals(prisma: PrismaClient): Promise<number> {
  const now = new Date();
  const expired = await prisma.approvalRequest.findMany({
    where: {
      status: ApprovalStatus.PENDING,
      expiresAt: { lte: now },
    },
    select: {
      id: true,
      userId: true,
      aiSessionId: true,
      transactionId: true,
    },
    take: 100,
  });

  if (expired.length === 0) {
    return 0;
  }

  for (const approval of expired) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.approvalRequest.updateMany({
        where: {
          id: approval.id,
          status: ApprovalStatus.PENDING,
          expiresAt: { lte: now },
        },
        data: { status: ApprovalStatus.EXPIRED },
      });

      if (updated.count === 0) {
        return;
      }

      await tx.transaction.updateMany({
        where: {
          id: approval.transactionId,
          status: TransactionStatus.PENDING_APPROVAL,
        },
        data: {
          status: TransactionStatus.EXPIRED,
          rejectionReason: APPROVAL_EXPIRED_MESSAGE,
          completedAt: now,
        },
      });

      await tx.idempotencyRecord.updateMany({
        where: { transactionId: approval.transactionId },
        data: { status: IdempotencyStatus.FAILED },
      });

      await tx.auditLog.create({
        data: {
          userId: approval.userId,
          aiSessionId: approval.aiSessionId,
          transactionId: approval.transactionId,
          action: "APPROVAL_EXPIRED",
          actor: AuditActor.SYSTEM,
          details: { message: APPROVAL_EXPIRED_MESSAGE },
        },
      });
    });
  }

  return expired.length;
}
