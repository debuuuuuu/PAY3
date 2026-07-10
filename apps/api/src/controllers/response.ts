import type { Request, Response } from "express";

export function sendData(
  req: Request,
  res: Response,
  data: unknown,
  status = 200,
): void {
  res.status(status).json({ data, requestId: req.requestId });
}

export function sendNotFound(req: Request, res: Response, message: string): void {
  res.status(404).json({
    error: "NOT_FOUND",
    message,
    requestId: req.requestId,
  });
}
