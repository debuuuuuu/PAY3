import type { Request, Response } from "express";
import { sendData } from "./response.js";

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const summary = await res.locals.services.dashboard.getSummary(
    req.auth!.userId,
    req.auth!.walletId,
  );
  sendData(req, res, summary);
}
