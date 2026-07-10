import { Router } from "express";
import {
  createPolicy,
  getPolicy,
  listPolicies,
} from "../controllers/policy.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createPolicyRoutes() {
  const router = Router();
  router.get("/", asyncHandler(listPolicies));
  router.post("/", asyncHandler(createPolicy));
  router.get("/:policyId", asyncHandler(getPolicy));
  return router;
}
