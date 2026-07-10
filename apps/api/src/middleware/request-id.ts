import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header(REQUEST_ID_HEADER)?.trim();
  req.requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, req.requestId);
  next();
};
