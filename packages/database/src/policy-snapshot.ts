import type { Policy } from "@prisma/client";

/** Frozen policy attached to an AI session at authorization time. */
export type PolicySnapshot = {
  policyId: string;
  name: string;
  preset: Policy["preset"];
  dailyBudget: string;
  monthlyBudget: string | null;
  perTransactionMax: string;
  manualApprovalThreshold: string;
  sessionDurationHours: number;
  allowedAssets: string[];
  allowedActions: string[];
  allowedProtocols: string[];
  allowedContracts: string[];
  allowedRecipientIds: string[];
  rateLimitPerMinute: number | null;
  capturedAt: string;
};

export function buildPolicySnapshot(policy: Policy): PolicySnapshot {
  return {
    policyId: policy.id,
    name: policy.name,
    preset: policy.preset,
    dailyBudget: policy.dailyBudget.toString(),
    monthlyBudget: policy.monthlyBudget?.toString() ?? null,
    perTransactionMax: policy.perTransactionMax.toString(),
    manualApprovalThreshold: policy.manualApprovalThreshold.toString(),
    sessionDurationHours: policy.sessionDurationHours,
    allowedAssets: [...policy.allowedAssets],
    allowedActions: [...policy.allowedActions],
    allowedProtocols: [...policy.allowedProtocols],
    allowedContracts: [...policy.allowedContracts],
    allowedRecipientIds: [...policy.allowedRecipientIds],
    rateLimitPerMinute: policy.rateLimitPerMinute,
    capturedAt: new Date().toISOString(),
  };
}
