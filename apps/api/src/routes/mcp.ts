import { Router } from "express";
import { requireMcpAuth, type McpAuthedRequest } from "../middleware/mcp-auth.js";
import {
  mcpGetBalance,
  mcpGetHistory,
  mcpTransfer,
} from "../mcp-service.js";

export const mcpRouter = Router();

mcpRouter.use(requireMcpAuth);

mcpRouter.get("/balance", async (req, res) => {
  const { userId, sessionId } = req as McpAuthedRequest;
  const asset = req.query.asset ? String(req.query.asset) : null;
  const result = await mcpGetBalance({ userId, sessionId }, asset);
  res.status(result.status).json(result.body);
});

mcpRouter.post("/transfer", async (req, res) => {
  const { userId, sessionId } = req as McpAuthedRequest;
  const result = await mcpTransfer(
    { userId, sessionId },
    {
      recipient: String(req.body?.recipient ?? ""),
      asset: req.body?.asset ? String(req.body.asset) : "XLM",
      amount: String(req.body?.amount ?? ""),
      idempotencyKey: req.body?.idempotencyKey
        ? String(req.body.idempotencyKey)
        : undefined,
    }
  );
  res.status(result.status).json(result.body);
});

mcpRouter.get("/history", async (req, res) => {
  const { userId, sessionId } = req as McpAuthedRequest;
  const result = await mcpGetHistory({ userId, sessionId });
  res.status(result.status).json(result.body);
});
