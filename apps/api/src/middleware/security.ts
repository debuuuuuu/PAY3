import cors from "cors";
import helmet from "helmet";
import type { Pay3Config } from "@pay3/shared";
import type { RequestHandler } from "express";
import { REQUEST_ID_HEADER } from "./request-id.js";

export function createSecurityMiddleware(config: Pay3Config): RequestHandler[] {
  return [
    helmet(),
    cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", REQUEST_ID_HEADER],
    }),
  ];
}
