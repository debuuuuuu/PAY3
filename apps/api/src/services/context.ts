import type { WalletAuthService } from "@pay3/auth";
import type { PrismaClient } from "@pay3/database";
import type { AiSessionManager } from "@pay3/session-manager";
import type { Pay3Config } from "@pay3/shared";
import type { StellarClient } from "@pay3/stellar";
import type { TransactionEngine } from "@pay3/transaction-engine";
import { AnalyticsAppService } from "./analytics.service.js";
import { AuthAppService } from "./auth.service.js";
import { AiSessionAppService } from "./ai-session.service.js";
import { ApprovalAppService } from "./approval.service.js";
import { ContactAppService } from "./contact.service.js";
import { DashboardAppService } from "./dashboard.service.js";
import { PolicyAppService } from "./policy.service.js";
import { SmartAccountAppService } from "./smart-account.service.js";
import { TransactionAppService } from "./transaction.service.js";
import { TransferAppService } from "./transfer.service.js";
import { WalletAppService } from "./wallet.service.js";

export interface ServiceContext {
  prisma: PrismaClient;
  config: Pay3Config;
  walletAuth: WalletAuthService;
  stellar: StellarClient;
  aiSessions: AiSessionManager;
  transactions: TransactionEngine;
}

export interface AppServices {
  auth: AuthAppService;
  wallet: WalletAppService;
  smartAccount: SmartAccountAppService;
  policy: PolicyAppService;
  contact: ContactAppService;
  aiSession: AiSessionAppService;
  transfer: TransferAppService;
  approval: ApprovalAppService;
  transaction: TransactionAppService;
  dashboard: DashboardAppService;
  analytics: AnalyticsAppService;
}

export function createServices(ctx: ServiceContext): AppServices {
  const wallet = new WalletAppService(ctx);
  const smartAccount = new SmartAccountAppService(ctx);
  const policy = new PolicyAppService(ctx);
  const contact = new ContactAppService(ctx);
  const aiSession = new AiSessionAppService(ctx);
  const transfer = new TransferAppService(ctx);
  const approval = new ApprovalAppService(ctx);
  const transaction = new TransactionAppService(ctx);
  const analytics = new AnalyticsAppService(ctx.prisma);
  const dashboard = new DashboardAppService({
    wallet,
    transaction,
    aiSession,
    approval,
    policy,
    analytics,
  });

  return {
    auth: new AuthAppService(ctx),
    wallet,
    smartAccount,
    policy,
    contact,
    aiSession,
    transfer,
    approval,
    transaction,
    dashboard,
    analytics,
  };
}
