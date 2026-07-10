import type { PrismaClient } from "@pay3/database";
import {
  getBudgetUsage,
  getMonthlyUsage,
  getUsageOverview,
  listAuditLogs,
  resolveUsagePeriod,
} from "../analytics/index.js";

export class AnalyticsAppService {
  constructor(private readonly prisma: PrismaClient) {}

  getMonthlyUsage(userId: string, year?: number, month?: number) {
    const period = resolveUsagePeriod(year, month);
    return getMonthlyUsage(this.prisma, userId, period);
  }

  getUsageOverview(userId: string, months?: number) {
    return getUsageOverview(this.prisma, userId, months ?? 6);
  }

  getBudgetUsage(userId: string) {
    return getBudgetUsage(this.prisma, userId);
  }

  listAuditLogs(userId: string, limit?: number) {
    return listAuditLogs(this.prisma, userId, limit ?? 50);
  }
}
