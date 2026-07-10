export type RecipientErrorCode =
  | "RECIPIENT_NOT_FOUND"
  | "RECIPIENT_AMBIGUOUS"
  | "INVALID_RECIPIENT_ADDRESS";

export class RecipientError extends Error {
  readonly name = "RecipientError";
  readonly code: RecipientErrorCode;

  constructor(code: RecipientErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
