import { Router } from "express";
import {
  approveTransaction,
  listPendingApprovals,
} from "../controllers/approval.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createApprovalRoutes() {
  const router = Router();
  router.get("/pending", asyncHandler(listPendingApprovals));
  router.post("/:transactionId/approve", asyncHandler(approveTransaction));
  return router;
}
