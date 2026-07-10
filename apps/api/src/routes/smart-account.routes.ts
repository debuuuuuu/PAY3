import { Router } from "express";
import {
  linkSmartAccount,
  listSmartAccounts,
} from "../controllers/smart-account.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createSmartAccountRoutes() {
  const router = Router();
  router.get("/", asyncHandler(listSmartAccounts));
  router.post("/", asyncHandler(linkSmartAccount));
  return router;
}
