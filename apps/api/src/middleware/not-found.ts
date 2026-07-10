import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found.`,
    requestId: req.requestId,
  });
};
