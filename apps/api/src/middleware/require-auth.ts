import { AuthError, type WalletAuthService } from "@pay3/auth";
import type { Pay3Config } from "@pay3/shared";
import type { RequestHandler } from "express";
import { extractSessionToken } from "./session-token.js";

export function createRequireAuth(
  authService: WalletAuthService,
  config: Pay3Config,
): RequestHandler {
  return async (req, res, next) => {
    const token = extractSessionToken(req, config.auth.sessionCookieName);
    if (!token) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required.",
        requestId: req.requestId,
      });
      return;
    }

    try {
      req.auth = await authService.validateSession(token);
      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({
          error: error.code,
          message: error.message,
          requestId: req.requestId,
        });
        return;
      }
      next(error);
    }
  };
}

export function createOptionalAuth(
  authService: WalletAuthService,
  config: Pay3Config,
): RequestHandler {
  return async (req, _res, next) => {
    const token = extractSessionToken(req, config.auth.sessionCookieName);
    if (!token) {
      next();
      return;
    }

    try {
      req.auth = await authService.validateSession(token);
    } catch {
      // Optional auth ignores invalid sessions.
    }
    next();
  };
}
