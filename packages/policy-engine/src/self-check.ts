import assert from "node:assert/strict";
import { PolicyDecision, TransactionAction } from "@pay3/database";
import type { PolicySnapshot } from "@pay3/database";
import { evaluateTransferPolicy } from "./evaluate.js";

const snapshot: PolicySnapshot = {
  policyId: "p1",
  name: "Balanced",
  preset: "BALANCED",
  dailyBudget: "500",
  monthlyBudget: null,
  perTransactionMax: "100",
  manualApprovalThreshold: "50",
  sessionDurationHours: 24,
  allowedAssets: ["USDC"],
  allowedActions: [TransactionAction.TRANSFER, TransactionAction.CHECK_BALANCE],
  allowedProtocols: [],
  allowedContracts: [],
  allowedRecipientIds: [],
  rateLimitPerMinute: null,
  capturedAt: new Date().toISOString(),
};

assert.equal(
  evaluateTransferPolicy({
    snapshot,
    asset: "USDC",
    amount: "25",
    dailySpent: "0",
    monthlySpent: "0",
  }),
  PolicyDecision.AUTO_EXECUTE,
);

assert.equal(
  evaluateTransferPolicy({
    snapshot,
    asset: "USDC",
    amount: "75",
    dailySpent: "0",
    monthlySpent: "0",
  }),
  PolicyDecision.PENDING_APPROVAL,
);

console.log("pay3 policy-engine self-check passed");
