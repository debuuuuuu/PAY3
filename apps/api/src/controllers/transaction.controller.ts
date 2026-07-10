import type { Request, Response } from "express";
import { sendData, sendNotFound } from "./response.js";
import { requireUuid } from "./validation.js";

export async function listTransactions(req: Request, res: Response): Promise<void> {
  const limit =
    typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 50;
  const transactions = await res.locals.services.transaction.listTransactions(
    req.auth!.userId,
    Number.isFinite(limit) ? limit : 50,
  );
  sendData(req, res, transactions);
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  const transactionId = requireUuid(req.params.transactionId, "transactionId");
  const transaction = await res.locals.services.transaction.getTransaction(
    req.auth!.userId,
    transactionId,
  );
  if (!transaction) {
    sendNotFound(req, res, "Transaction not found.");
    return;
  }
  sendData(req, res, transaction);
}
