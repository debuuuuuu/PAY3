import type { RequestHandler } from "express";
import { Router } from "express";
import { createAnalyticsRoutes } from "./analytics.routes.js";
import { createAiSessionRoutes } from "./ai-session.routes.js";
import { createApprovalRoutes } from "./approval.routes.js";
import { createAuthRoutes } from "./auth.routes.js";
import { createContactRoutes } from "./contact.routes.js";
import { createDashboardRoutes } from "./dashboard.routes.js";
import { createPolicyRoutes } from "./policy.routes.js";
import { createSmartAccountRoutes } from "./smart-account.routes.js";
import { createTransactionRoutes } from "./transaction.routes.js";
import { createWalletRoutes } from "./wallet.routes.js";

export function createApiRouter(requireAuth: RequestHandler) {
  const router = Router();

  router.use("/auth", createAuthRoutes(requireAuth));

  const protectedRouter = Router();
  protectedRouter.use(requireAuth);
  protectedRouter.use("/wallet", createWalletRoutes());
  protectedRouter.use("/smart-accounts", createSmartAccountRoutes());
  protectedRouter.use("/policies", createPolicyRoutes());
  protectedRouter.use("/ai-sessions", createAiSessionRoutes());
  protectedRouter.use("/contacts", createContactRoutes());
  protectedRouter.use("/approvals", createApprovalRoutes());
  protectedRouter.use("/transactions", createTransactionRoutes());
  protectedRouter.use("/dashboard", createDashboardRoutes());
  protectedRouter.use("/analytics", createAnalyticsRoutes());

  router.use(protectedRouter);

  return router;
}
