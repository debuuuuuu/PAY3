import type { Request, Response } from "express";
import { sendData } from "./response.js";
import { optionalString, requireUuid } from "./validation.js";

export async function listPendingApprovals(req: Request, res: Response): Promise<void> {
  const approvals = await res.locals.services.approval.listPendingApprovals(
    req.auth!.userId,
  );
  sendData(req, res, approvals);
}

export async function approveTransaction(req: Request, res: Response): Promise<void> {
  const transactionId = requireUuid(req.params.transactionId, "transactionId");
  const transaction = await res.locals.services.approval.approveTransaction(
    req.auth!.userId,
    transactionId,
    optionalString(req.body?.walletSignature),
  );
  sendData(req, res, transaction);
}
