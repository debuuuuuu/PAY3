import { BudgetPeriodType, type PrismaClient } from "@pay3/database";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function getBudgetUsage(prisma: PrismaClient, userId: string) {
  const now = new Date();
  const sessions = await prisma.aiSession.findMany({
    where: { userId, status: "ACTIVE", expiresAt: { gt: now } },
    select: {
      id: true,
      clientType: true,
      smartAccountId: true,
      policy: {
        select: {
          dailyBudget: true,
          monthlyBudget: true,
          allowedAssets: true,
        },
      },
    },
  });

  const sessionIds = sessions.map((session) => session.id);
  if (sessionIds.length === 0) {
    return { sessions: [] };
  }

  const usage = await prisma.budgetUsage.findMany({
    where: {
      aiSessionId: { in: sessionIds },
      OR: [
        { periodType: BudgetPeriodType.DAILY, periodStart: startOfUtcDay(now) },
        { periodType: BudgetPeriodType.MONTHLY, periodStart: startOfUtcMonth(now) },
      ],
    },
  });

  return {
    sessions: sessions.map((session) => {
      const daily = usage.filter(
        (row) =>
          row.aiSessionId === session.id && row.periodType === BudgetPeriodType.DAILY,
      );
      const monthly = usage.filter(
        (row) =>
          row.aiSessionId === session.id && row.periodType === BudgetPeriodType.MONTHLY,
      );

      return {
        sessionId: session.id,
        clientType: session.clientType,
        smartAccountId: session.smartAccountId,
        policy: {
          dailyBudget: session.policy.dailyBudget.toString(),
          monthlyBudget: session.policy.monthlyBudget?.toString() ?? null,
          allowedAssets: session.policy.allowedAssets,
        },
        dailySpent: daily.map((row) => ({
          asset: row.asset,
          spentAmount: row.spentAmount.toString(),
        })),
        monthlySpent: monthly.map((row) => ({
          asset: row.asset,
          spentAmount: row.spentAmount.toString(),
        })),
      };
    }),
  };
}
