import { PolicyDecision, TransactionAction } from "@pay3/database";
import type { PolicySnapshot } from "@pay3/database";
import { Decimal } from "@prisma/client/runtime/library";
import { PolicyError } from "./errors.js";

export interface TransferPolicyInput {
  snapshot: PolicySnapshot;
  asset: string;
  amount: string;
  dailySpent: string;
  monthlySpent: string;
  recipientContactId?: string | null;
}

function decimal(value: string): Decimal {
  return new Decimal(value);
}

export function evaluateTransferPolicy(
  input: TransferPolicyInput,
): PolicyDecision {
  const snapshot = input.snapshot;
  const amount = decimal(input.amount);
  const dailySpent = decimal(input.dailySpent);
  const monthlySpent = decimal(input.monthlySpent);
  const perTxMax = decimal(snapshot.perTransactionMax);
  const approvalThreshold = decimal(snapshot.manualApprovalThreshold);
  const dailyBudget = decimal(snapshot.dailyBudget);

  if (!snapshot.allowedActions.includes(TransactionAction.TRANSFER)) {
    throw new PolicyError("ACTION_NOT_ALLOWED", "Transfers are not allowed by policy.");
  }

  const asset = input.asset.trim().toUpperCase();
  const allowedAssets = snapshot.allowedAssets.map((a) => a.toUpperCase());
  if (!allowedAssets.includes(asset)) {
    throw new PolicyError("ASSET_NOT_ALLOWED", `Asset ${asset} is not allowed by policy.`);
  }

  if (
    snapshot.allowedRecipientIds.length > 0 &&
    input.recipientContactId &&
    !snapshot.allowedRecipientIds.includes(input.recipientContactId)
  ) {
    throw new PolicyError("RECIPIENT_NOT_ALLOWED", "Recipient is not allowed by policy.");
  }

  if (amount.gt(perTxMax)) {
    throw new PolicyError(
      "PER_TRANSACTION_LIMIT_EXCEEDED",
      `Amount exceeds per-transaction maximum of ${snapshot.perTransactionMax} ${asset}.`,
    );
  }

  if (dailySpent.add(amount).gt(dailyBudget)) {
    throw new PolicyError(
      "DAILY_BUDGET_EXCEEDED",
      `Transfer would exceed the daily budget of ${snapshot.dailyBudget} ${asset}.`,
    );
  }

  if (snapshot.monthlyBudget) {
    const monthlyBudget = decimal(snapshot.monthlyBudget);
    if (monthlySpent.add(amount).gt(monthlyBudget)) {
      throw new PolicyError(
        "MONTHLY_BUDGET_EXCEEDED",
        `Transfer would exceed the monthly budget of ${snapshot.monthlyBudget} ${asset}.`,
      );
    }
  }

  if (amount.gt(approvalThreshold)) {
    return PolicyDecision.PENDING_APPROVAL;
  }

  return PolicyDecision.AUTO_EXECUTE;
}

export function assertBalanceReadAllowed(snapshot: PolicySnapshot): void {
  if (!snapshot.allowedActions.includes(TransactionAction.CHECK_BALANCE)) {
    throw new PolicyError("ACTION_NOT_ALLOWED", "Balance checks are not allowed by policy.");
  }
}

export function assertHistoryReadAllowed(snapshot: PolicySnapshot): void {
  if (!snapshot.allowedActions.includes(TransactionAction.VIEW_TRANSACTION_HISTORY)) {
    throw new PolicyError(
      "ACTION_NOT_ALLOWED",
      "Transaction history is not allowed by policy.",
    );
  }
}
