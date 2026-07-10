import { Router } from "express";
import { getWalletOverview } from "../controllers/wallet.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createWalletRoutes() {
  const router = Router();
  router.get("/overview", asyncHandler(getWalletOverview));
  return router;
}
