/**
 * Hosted MCP over Streamable HTTP (stateless + JSON).
 * Exact path POST/GET/DELETE /mcp — REST tools stay at /mcp/balance|transfer|history.
 *
 * ponytail: stateless so Vercel serverless needs no sticky session map;
 * upgrade to sticky/stateful only if a host requires resumable SSE.
 */
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as z from "zod/v4";
import {
  extractMcpToken,
  resolveMcpToken,
} from "./middleware/mcp-auth.js";
import {
  mcpGetBalance,
  mcpGetHistory,
  mcpTransfer,
  type McpSessionCtx,
} from "./mcp-service.js";

function textResult(data: unknown, isError = false) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

function createPay3McpServer(ctx: McpSessionCtx): McpServer {
  const server = new McpServer(
    { name: "pay3", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "get_balance",
    {
      description:
        "Get the Pay3 smart-account (allocation) balances for the authenticated AI session.",
      inputSchema: {
        asset: z
          .string()
          .optional()
          .describe("Optional asset filter, e.g. XLM"),
      },
    },
    async ({ asset }) => {
      const result = await mcpGetBalance(ctx, asset ?? null);
      return textResult(result.body, result.status >= 400);
    }
  );

  server.registerTool(
    "transfer",
    {
      description:
        "Transfer funds from the Pay3 allocation account. Recipient can be a saved contact name or a Stellar G-address. Never guess ambiguous names.",
      inputSchema: {
        recipient: z
          .string()
          .describe("Contact name or Stellar public key"),
        asset: z
          .string()
          .default("XLM")
          .describe("Asset code (XLM for MVP)"),
        amount: z.string().describe("Amount to send as a decimal string"),
        idempotency_key: z
          .string()
          .optional()
          .describe("Optional idempotency key to prevent duplicate payments"),
      },
    },
    async ({ recipient, asset, amount, idempotency_key }) => {
      const result = await mcpTransfer(ctx, {
        recipient,
        asset,
        amount,
        idempotencyKey: idempotency_key,
      });
      return textResult(result.body, result.status >= 400);
    }
  );

  server.registerTool(
    "get_transaction_history",
    {
      description:
        "List recent Pay3 transfers and Horizon payments for this session's allocation account.",
      inputSchema: {},
    },
    async () => {
      const result = await mcpGetHistory(ctx);
      return textResult(result.body, result.status >= 400);
    }
  );

  return server;
}

export async function handleMcpHttp(
  req: Request,
  res: Response
): Promise<void> {
  if (req.method === "GET" || req.method === "DELETE") {
    res
      .status(405)
      .set("Allow", "POST")
      .json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
      });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).set("Allow", "POST").end();
    return;
  }

  const auth = await resolveMcpToken(extractMcpToken(req));
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const server = createPay3McpServer({
    userId: auth.userId,
    sessionId: auth.sessionId,
  });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("hosted MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  } finally {
    // ponytail: JSON/stateless responses finish in one shot; close after handle
    void transport.close();
    void server.close();
  }
}
