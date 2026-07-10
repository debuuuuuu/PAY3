import type { RequestHandler } from "express";
import { Router } from "express";
import {
  createChallenge,
  getMe,
  logout,
  verifyChallenge,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createAuthRoutes(requireAuth: RequestHandler) {
  const router = Router();

  router.post("/challenge", asyncHandler(createChallenge));
  router.post("/verify", asyncHandler(verifyChallenge));
  router.post("/logout", asyncHandler(logout));
  router.get("/me", requireAuth, asyncHandler(getMe));

  return router;
}
