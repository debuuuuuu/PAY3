import type { Request, Response } from "express";
import { sendData } from "./response.js";

export async function getWalletOverview(req: Request, res: Response): Promise<void> {
  const overview = await res.locals.services.wallet.getWalletOverview(
    req.auth!.userId,
    req.auth!.walletId,
  );
  sendData(req, res, overview);
}
