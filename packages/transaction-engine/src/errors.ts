export type TransactionEngineErrorCode =
  | "IDEMPOTENCY_CONFLICT"
  | "TRANSACTION_NOT_FOUND"
  | "INVALID_STATE"
  | "APPROVAL_EXPIRED";

export class TransactionEngineError extends Error {
  readonly name = "TransactionEngineError";
  readonly code: TransactionEngineErrorCode;

  constructor(code: TransactionEngineErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
