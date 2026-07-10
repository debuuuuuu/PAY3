import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createDashboardRoutes() {
  const router = Router();
  router.get("/", asyncHandler(getDashboardSummary));
  return router;
}
