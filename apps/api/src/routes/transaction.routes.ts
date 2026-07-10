import { Router } from "express";
import {
  getTransaction,
  listTransactions,
} from "../controllers/transaction.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createTransactionRoutes() {
  const router = Router();
  router.get("/", asyncHandler(listTransactions));
  router.get("/:transactionId", asyncHandler(getTransaction));
  return router;
}
