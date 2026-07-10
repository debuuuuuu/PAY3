import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpRuntime } from "../runtime.js";
import { formatTransaction, mapPay3Error, toolError, toolJson } from "./format.js";

const assetSchema = z
  .string()
  .trim()
  .min(1)
  .describe('Asset code, e.g. "USDC" or "XLM".');

const amountSchema = z
  .string()
  .trim()
  .min(1)
  .describe('Payment amount as a decimal string, e.g. "5".');

const recipientSchema = z
  .string()
  .trim()
  .min(1)
  .describe("Verified contact name, alias, or Stellar public key.");

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .describe(
    "Stable key for this payment intent. Reuse the same key when retrying the same transfer.",
  );

export function registerPay3Tools(
  server: McpServer,
  runtime: McpRuntime,
  mcpToken: string,
): void {
  server.registerTool(
    "get_balance",
    {
      description:
        "Returns the authorized balance for the Pay3 AI session smart-account key.",
      inputSchema: z.object({ asset: assetSchema }),
    },
    async ({ asset }) => {
      try {
        const result = await runtime.transfer.getBalance(mcpToken, asset);
        return toolJson(result);
      } catch (error) {
        return mapPay3Error(error);
      }
    },
  );

  server.registerTool(
    "transfer",
    {
      description:
        "Initiates a Stellar payment from the delegated Pay3 session. Resolves the recipient, evaluates policy, and either auto-executes, queues manual approval, or rejects.",
      inputSchema: z.object({
        recipient: recipientSchema,
        asset: assetSchema,
        amount: amountSchema,
        idempotency_key: idempotencyKeySchema,
      }),
    },
    async ({ recipient, asset, amount, idempotency_key }) => {
      try {
        const transaction = await runtime.transfer.transfer({
          mcpToken,
          idempotencyKey: idempotency_key,
          recipient,
          asset,
          amount,
        });

        const formatted = formatTransaction(transaction);
        if (formatted.status === "PENDING_APPROVAL") {
          return toolJson({
            ...formatted,
            message:
              "Payment requires manual approval in the Pay3 dashboard. The approval request expires in 2 minutes.",
          });
        }
        if (formatted.status === "REJECTED") {
          return toolError(
            formatted.rejectionReason ??
              "Payment was rejected by policy.",
          );
        }
        return toolJson(formatted);
      } catch (error) {
        return mapPay3Error(error);
      }
    },
  );

  server.registerTool(
    "get_transaction_history",
    {
      description:
        "Lists recent Pay3 transactions for this AI session, newest first.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Maximum rows to return (default 20)."),
      }),
    },
    async ({ limit }) => {
      try {
        const rows = await runtime.transfer.getTransactionHistory(
          mcpToken,
          limit ?? 20,
        );
        return toolJson({
          transactions: rows.map(formatTransaction),
        });
      } catch (error) {
        return mapPay3Error(error);
      }
    },
  );
}
