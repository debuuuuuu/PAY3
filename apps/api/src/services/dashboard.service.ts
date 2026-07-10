import type { AnalyticsAppService } from "./analytics.service.js";
import type { AiSessionAppService } from "./ai-session.service.js";
import type { ApprovalAppService } from "./approval.service.js";
import type { PolicyAppService } from "./policy.service.js";
import type { TransactionAppService } from "./transaction.service.js";
import type { WalletAppService } from "./wallet.service.js";

export class DashboardAppService {
  constructor(
    private readonly deps: {
      wallet: WalletAppService;
      transaction: TransactionAppService;
      aiSession: AiSessionAppService;
      approval: ApprovalAppService;
      policy: PolicyAppService;
      analytics: AnalyticsAppService;
    },
  ) {}

  async getSummary(userId: string, walletId: string) {
    const [walletOverview, transactions, sessions, approvals, policies, monthlyUsage, budgetUsage] =
      await Promise.all([
        this.deps.wallet.getWalletOverview(userId, walletId),
        this.deps.transaction.listTransactions(userId, 10),
        this.deps.aiSession.listActiveSessions(userId),
        this.deps.approval.listPendingApprovals(userId),
        this.deps.policy.listPolicies(userId),
        this.deps.analytics.getMonthlyUsage(userId),
        this.deps.analytics.getBudgetUsage(userId),
      ]);

    return {
      wallet: walletOverview,
      recentTransactions: transactions,
      activeSessions: sessions,
      pendingApprovals: approvals,
      policies,
      monthlyUsage,
      budgetUsage,
    };
  }
}
