import type { Request } from "express";
import type { Pay3Config } from "@pay3/shared";

const BEARER_PREFIX = /^Bearer\s+/i;

export function extractSessionToken(
  req: Request,
  cookieName: string,
): string | null {
  const authorization = req.header("authorization")?.trim();
  if (authorization && BEARER_PREFIX.test(authorization)) {
    const token = authorization.replace(BEARER_PREFIX, "").trim();
    if (token.length > 0) {
      return token;
    }
  }

  const cookieToken = req.cookies?.[cookieName];
  if (typeof cookieToken === "string" && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  return null;
}

export function getSessionCookieOptions(config: Pay3Config) {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax" as const,
    maxAge: config.auth.sessionMaxAgeMs,
    path: "/",
  };
}
