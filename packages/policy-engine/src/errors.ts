export type PolicyErrorCode =
  | "ACTION_NOT_ALLOWED"
  | "ASSET_NOT_ALLOWED"
  | "RECIPIENT_NOT_ALLOWED"
  | "PER_TRANSACTION_LIMIT_EXCEEDED"
  | "DAILY_BUDGET_EXCEEDED"
  | "MONTHLY_BUDGET_EXCEEDED";

export class PolicyError extends Error {
  readonly name = "PolicyError";
  readonly code: PolicyErrorCode;

  constructor(code: PolicyErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
