import {
  AiSessionStatus,
  TransactionStatus,
  type PrismaClient,
} from "@pay3/database";
import type { TransactionEngine } from "@pay3/transaction-engine";
import { STUCK_SIGNING_THRESHOLD_MS } from "./constants.js";

export async function retryStuckTransfers(
  prisma: PrismaClient,
  transactions: TransactionEngine,
): Promise<number> {
  const stuckBefore = new Date(Date.now() - STUCK_SIGNING_THRESHOLD_MS);
  const stuck = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.SIGNING,
      stellarTransactionHash: null,
      updatedAt: { lte: stuckBefore },
    },
    select: { id: true, aiSessionId: true },
    take: 20,
  });

  let resumed = 0;
  for (const row of stuck) {
    const session = await prisma.aiSession.findUnique({
      where: { id: row.aiSessionId },
      select: { status: true, expiresAt: true },
    });

    if (
      !session ||
      session.status !== AiSessionStatus.ACTIVE ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      continue;
    }

    await transactions.resumeStuckTransfer(row.id);
    resumed += 1;
  }

  return resumed;
}
