import assert from "node:assert/strict";
import type { Request } from "express";
import { extractSessionToken, getSessionCookieOptions } from "../src/middleware/session-token.js";

function mockRequest(input: {
  authorization?: string;
  cookies?: Record<string, string>;
}): Request {
  return {
    header(name: string) {
      if (name.toLowerCase() === "authorization") {
        return input.authorization;
      }
      return undefined;
    },
    cookies: input.cookies,
  } as Request;
}

assert.equal(
  extractSessionToken(
    mockRequest({ authorization: "Bearer session-token-abc" }),
    "pay3_session",
  ),
  "session-token-abc",
);

assert.equal(
  extractSessionToken(
    mockRequest({ cookies: { pay3_session: "cookie-token" } }),
    "pay3_session",
  ),
  "cookie-token",
);

assert.equal(
  extractSessionToken(mockRequest({}), "pay3_session"),
  null,
);

const cookieOptions = getSessionCookieOptions({
  isProduction: true,
  auth: { sessionMaxAgeMs: 3600000 },
} as never);

assert.equal(cookieOptions.httpOnly, true);
assert.equal(cookieOptions.secure, true);
assert.equal(cookieOptions.maxAge, 3600000);

console.log("pay3 api middleware self-check passed");
