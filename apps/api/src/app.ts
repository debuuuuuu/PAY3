import { createWalletAuthService } from "@pay3/auth";
import { healthCheckDatabase, prisma } from "@pay3/database";
import { createAiSessionManager } from "@pay3/session-manager";
import { createStellarClient } from "@pay3/stellar";
import { createTransactionEngine } from "@pay3/transaction-engine";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { getConfig } from "./config/index.js";
import {
  asyncHandler,
  createErrorHandler,
  createRequireAuth,
  createSecurityMiddleware,
  notFoundHandler,
  requestIdMiddleware,
} from "./middleware/index.js";
import { createServices } from "./services/index.js";
import { createApiRouter } from "./routes/index.js";

export function createApp(): Express {
  const config = getConfig();
  const walletAuth = createWalletAuthService(prisma, config);
  const stellar = createStellarClient(config);
  const aiSessions = createAiSessionManager(prisma, config);
  const transactions = createTransactionEngine(prisma, config, aiSessions);
  const services = createServices({
    prisma,
    config,
    walletAuth,
    stellar,
    aiSessions,
    transactions,
  });

  const app = express();
  app.disable("x-powered-by");

  app.use(requestIdMiddleware);
  for (const middleware of createSecurityMiddleware(config)) {
    app.use(middleware);
  }
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.get(
    "/health",
    asyncHandler(async (req, res) => {
      const database = await healthCheckDatabase();
      res.status(database ? 200 : 503).json({
        status: database ? "ok" : "degraded",
        service: "pay3-api",
        database,
        requestId: req.requestId,
      });
    }),
  );

  const requireAuth = createRequireAuth(walletAuth, config);

  app.locals.requireAuth = requireAuth;
  app.locals.authService = walletAuth;
  app.locals.services = services;
  app.locals.config = config;

  app.use("/api", createApiRouter(requireAuth));

  app.use(notFoundHandler);
  app.use(createErrorHandler(config.isProduction));

  return app;
}
