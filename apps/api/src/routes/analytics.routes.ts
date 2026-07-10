import { Router } from "express";
import {
  getBudgetUsageReport,
  getMonthlyUsageReport,
  getUsageOverviewReport,
  listAuditLogs,
} from "../controllers/analytics.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createAnalyticsRoutes() {
  const router = Router();
  router.get("/usage", asyncHandler(getMonthlyUsageReport));
  router.get("/usage/overview", asyncHandler(getUsageOverviewReport));
  router.get("/budget", asyncHandler(getBudgetUsageReport));
  router.get("/audit-logs", asyncHandler(listAuditLogs));
  return router;
}
