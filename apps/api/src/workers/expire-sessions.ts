import { AiSessionStatus, type PrismaClient } from "@pay3/database";

export async function expireAiSessions(prisma: PrismaClient): Promise<number> {
  const now = new Date();
  const result = await prisma.aiSession.updateMany({
    where: {
      status: AiSessionStatus.ACTIVE,
      expiresAt: { lte: now },
    },
    data: { status: AiSessionStatus.EXPIRED },
  });
  return result.count;
}
