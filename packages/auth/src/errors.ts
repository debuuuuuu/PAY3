export type AuthErrorCode =
  | "INVALID_WALLET_ADDRESS"
  | "CHALLENGE_NOT_FOUND"
  | "CHALLENGE_EXPIRED"
  | "CHALLENGE_CONSUMED"
  | "CHALLENGE_WALLET_MISMATCH"
  | "INVALID_SIGNATURE"
  | "SESSION_INVALID"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED";

export class AuthError extends Error {
  readonly name = "AuthError";
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
