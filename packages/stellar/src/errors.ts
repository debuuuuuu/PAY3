export type StellarErrorCode =
  | "INVALID_ADDRESS"
  | "ACCOUNT_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "SUBMISSION_FAILED"
  | "SIMULATION_FAILED";

export class StellarError extends Error {
  readonly name = "StellarError";
  readonly code: StellarErrorCode;

  constructor(code: StellarErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
