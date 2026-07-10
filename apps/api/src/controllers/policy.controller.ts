import { PolicyPreset } from "@pay3/database";
import type { Request, Response } from "express";
import { sendData, sendNotFound } from "./response.js";
import {
  BadRequestError,
  optionalString,
  requireString,
  requireUuid,
} from "./validation.js";

function parsePolicyPreset(value: unknown): PolicyPreset {
  const preset = requireString(value, "preset").toUpperCase();
  if (!Object.values(PolicyPreset).includes(preset as PolicyPreset)) {
    throw new BadRequestError(`Invalid preset "${preset}".`);
  }
  return preset as PolicyPreset;
}

export async function listPolicies(req: Request, res: Response): Promise<void> {
  const policies = await res.locals.services.policy.listPolicies(req.auth!.userId);
  sendData(req, res, policies);
}

export async function createPolicy(req: Request, res: Response): Promise<void> {
  const policy = await res.locals.services.policy.createPolicy({
    userId: req.auth!.userId,
    name: requireString(req.body?.name, "name"),
    preset: parsePolicyPreset(req.body?.preset),
    dailyBudget: optionalString(req.body?.dailyBudget),
    perTransactionMax: optionalString(req.body?.perTransactionMax),
    manualApprovalThreshold: optionalString(req.body?.manualApprovalThreshold),
    sessionDurationHours:
      typeof req.body?.sessionDurationHours === "number"
        ? req.body.sessionDurationHours
        : undefined,
    allowedAssets: Array.isArray(req.body?.allowedAssets)
      ? req.body.allowedAssets.map(String)
      : undefined,
    monthlyBudget:
      req.body?.monthlyBudget === null ? null : optionalString(req.body?.monthlyBudget),
    allowedRecipientIds: Array.isArray(req.body?.allowedRecipientIds)
      ? req.body.allowedRecipientIds.map(String)
      : undefined,
    rateLimitPerMinute:
      typeof req.body?.rateLimitPerMinute === "number"
        ? req.body.rateLimitPerMinute
        : undefined,
  });
  sendData(req, res, policy, 201);
}

export async function getPolicy(req: Request, res: Response): Promise<void> {
  const policyId = requireUuid(req.params.policyId, "policyId");
  const policy = await res.locals.services.policy.getPolicy(req.auth!.userId, policyId);
  if (!policy) {
    sendNotFound(req, res, "Policy not found.");
    return;
  }
  sendData(req, res, policy);
}
