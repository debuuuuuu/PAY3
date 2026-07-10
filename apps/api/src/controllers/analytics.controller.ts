import type { Request, Response } from "express";
import { BadRequestError } from "./validation.js";
import { sendData } from "./response.js";

function parseOptionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new BadRequestError(`${field} must be an integer.`);
  }
  return parsed;
}

export async function getMonthlyUsageReport(req: Request, res: Response): Promise<void> {
  const year = parseOptionalInt(req.query.year, "year");
  const month = parseOptionalInt(req.query.month, "month");
  const report = await res.locals.services.analytics.getMonthlyUsage(
    req.auth!.userId,
    year,
    month,
  );
  sendData(req, res, report);
}

export async function getUsageOverviewReport(req: Request, res: Response): Promise<void> {
  const months = parseOptionalInt(req.query.months, "months");
  if (months !== undefined && (months < 1 || months > 24)) {
    throw new BadRequestError("months must be between 1 and 24.");
  }
  const report = await res.locals.services.analytics.getUsageOverview(
    req.auth!.userId,
    months,
  );
  sendData(req, res, report);
}

export async function getBudgetUsageReport(req: Request, res: Response): Promise<void> {
  const report = await res.locals.services.analytics.getBudgetUsage(req.auth!.userId);
  sendData(req, res, report);
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const limit = parseOptionalInt(req.query.limit, "limit");
  if (limit !== undefined && (limit < 1 || limit > 100)) {
    throw new BadRequestError("limit must be between 1 and 100.");
  }
  const logs = await res.locals.services.analytics.listAuditLogs(
    req.auth!.userId,
    limit,
  );
  sendData(req, res, { logs });
}
