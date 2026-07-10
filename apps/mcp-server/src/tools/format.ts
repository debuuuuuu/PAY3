import { PolicyError } from "@pay3/policy-engine";
import { RecipientError } from "@pay3/recipient-resolver";
import { SessionManagerError } from "@pay3/session-manager";
import { StellarError } from "@pay3/stellar";
import { TransactionEngineError } from "@pay3/transaction-engine";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

type Decimalish = { toString(): string } | null | undefined;
type Dateish = Date | null | undefined;

export interface TransactionRow {
  id: string;
  action: string;
  asset: string;
  amount: Decimalish;
  recipientInput: string | null;
  recipientAddress: string | null;
  status: string;
  policyDecision: string;
  rejectionReason?: string | null;
  stellarTransactionHash: string | null;
  createdAt: Dateish;
  completedAt: Dateish;
}

export function formatTransaction(row: TransactionRow) {
  return {
    id: row.id,
    action: row.action,
    asset: row.asset,
    amount: row.amount?.toString() ?? null,
    recipientInput: row.recipientInput,
    recipientAddress: row.recipientAddress,
    status: row.status,
    policyDecision: row.policyDecision,
    rejectionReason: row.rejectionReason ?? null,
    stellarTransactionHash: row.stellarTransactionHash,
    createdAt: row.createdAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export function toolJson(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function toolError(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export function mapPay3Error(error: unknown): CallToolResult {
  if (error instanceof SessionManagerError) {
    return toolError(error.message);
  }
  if (error instanceof PolicyError) {
    return toolError(error.message);
  }
  if (error instanceof RecipientError) {
    return toolError(error.message);
  }
  if (error instanceof TransactionEngineError) {
    return toolError(error.message);
  }
  if (error instanceof StellarError) {
    return toolError(error.message);
  }
  if (error instanceof Error) {
    return toolError(error.message);
  }
  return toolError("An unexpected error occurred.");
}
