import type { Request, Response } from "express";
import { sendData } from "./response.js";
import { requireString } from "./validation.js";

export async function listSmartAccounts(req: Request, res: Response): Promise<void> {
  const accounts = await res.locals.services.smartAccount.listSmartAccounts(
    req.auth!.userId,
  );
  sendData(req, res, accounts);
}

export async function linkSmartAccount(req: Request, res: Response): Promise<void> {
  const contractId = requireString(req.body?.contractId, "contractId");
  const account = await res.locals.services.smartAccount.linkSmartAccount({
    userId: req.auth!.userId,
    walletId: req.auth!.walletId,
    contractId,
  });
  sendData(req, res, account, 201);
}
