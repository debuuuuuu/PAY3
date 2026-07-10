import type { PrismaClient } from "@pay3/database";
import { formatUsageRecord, resolveUsagePeriod, type UsagePeriod } from "./period.js";

export async function getMonthlyUsage(
  prisma: PrismaClient,
  userId: string,
  period: UsagePeriod,
) {
  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      periodYear: period.year,
      periodMonth: period.month,
    },
    orderBy: [{ asset: "asc" }, { aiSessionId: "asc" }],
  });

  return {
    period,
    records: records.map(formatUsageRecord),
    totalsByAsset: summarizeByAsset(records),
  };
}

export async function getUsageOverview(prisma: PrismaClient, userId: string, months = 6) {
  const now = new Date();
  const periods: UsagePeriod[] = [];

  for (let offset = 0; offset < months; offset += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    periods.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
    });
  }

  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      OR: periods.map((period) => ({
        periodYear: period.year,
        periodMonth: period.month,
      })),
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { asset: "asc" }],
  });

  return {
    months: periods,
    records: records.map(formatUsageRecord),
    totalsByAsset: summarizeByAsset(records),
  };
}

function summarizeByAsset(
  records: Array<{ asset: string; totalAmount: { toString(): string }; transactionCount: number }>,
) {
  const totals = new Map<string, { totalAmount: string; transactionCount: number }>();

  for (const record of records) {
    const asset = record.asset.toUpperCase();
    const current = totals.get(asset) ?? { totalAmount: "0", transactionCount: 0 };
    const nextAmount = (Number(current.totalAmount) + Number(record.totalAmount.toString())).toString();
    totals.set(asset, {
      totalAmount: nextAmount,
      transactionCount: current.transactionCount + record.transactionCount,
    });
  }

  return Object.fromEntries(totals);
}

export { resolveUsagePeriod };
