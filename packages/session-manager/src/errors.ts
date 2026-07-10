export type SessionManagerErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_INACTIVE"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "INVALID_MCP_TOKEN";

export class SessionManagerError extends Error {
  readonly name = "SessionManagerError";
  readonly code: SessionManagerErrorCode;

  constructor(code: SessionManagerErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
