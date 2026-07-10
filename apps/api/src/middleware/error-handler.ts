import { AuthError } from "@pay3/auth";
import { PolicyError } from "@pay3/policy-engine";
import { RecipientError } from "@pay3/recipient-resolver";
import { SessionManagerError } from "@pay3/session-manager";
import { ConfigError } from "@pay3/shared";
import { StellarError } from "@pay3/stellar";
import { TransactionEngineError } from "@pay3/transaction-engine";
import type { ErrorRequestHandler } from "express";
import { BadRequestError, NotFoundError } from "../controllers/validation.js";

export function createErrorHandler(isProduction: boolean): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const base = { requestId: req.requestId };

    if (error instanceof BadRequestError) {
      res.status(400).json({ error: "BAD_REQUEST", message: error.message, ...base });
      return;
    }

    if (error instanceof NotFoundError) {
      res.status(404).json({ error: "NOT_FOUND", message: error.message, ...base });
      return;
    }

    if (error instanceof AuthError) {
      res.status(401).json({ error: error.code, message: error.message, ...base });
      return;
    }

    if (error instanceof SessionManagerError) {
      res.status(401).json({ error: error.code, message: error.message, ...base });
      return;
    }

    if (error instanceof PolicyError) {
      res.status(403).json({ error: error.code, message: error.message, ...base });
      return;
    }

    if (error instanceof RecipientError) {
      const status = error.code === "RECIPIENT_AMBIGUOUS" ? 409 : 400;
      res.status(status).json({ error: error.code, message: error.message, ...base });
      return;
    }

    if (error instanceof TransactionEngineError) {
      const status = error.code === "IDEMPOTENCY_CONFLICT" ? 409 : 400;
      res.status(status).json({ error: error.code, message: error.message, ...base });
      return;
    }

    if (error instanceof StellarError) {
      const status =
        error.code === "INSUFFICIENT_BALANCE" || error.code === "ACCOUNT_NOT_FOUND"
          ? 400
          : 502;
      res.status(status).json({ error: error.code, message: error.message, ...base });
      return;
    }

    if (error instanceof ConfigError) {
      res.status(500).json({
        error: "CONFIG_ERROR",
        message: isProduction ? "Server configuration error." : error.message,
        ...base,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    if (!isProduction && error instanceof Error) {
      console.error(`[${req.requestId}]`, error);
    }

    res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "An unexpected error occurred." : message,
      ...base,
    });
  };
}
