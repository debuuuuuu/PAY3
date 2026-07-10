import { Router } from "express";
import {
  createAiSession,
  listAiSessions,
  revokeAiSession,
  revokeAllAiSessions,
} from "../controllers/ai-session.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createAiSessionRoutes() {
  const router = Router();
  router.get("/", asyncHandler(listAiSessions));
  router.post("/", asyncHandler(createAiSession));
  router.post("/revoke-all", asyncHandler(revokeAllAiSessions));
  router.delete("/:sessionId", asyncHandler(revokeAiSession));
  return router;
}
