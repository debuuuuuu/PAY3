import assert from "node:assert/strict";
import { formatTransaction, mapPay3Error, toolError } from "../src/tools/format.js";
import { requireMcpAuthToken } from "../src/auth.js";
import { RecipientError } from "@pay3/recipient-resolver";

assert.deepEqual(
  formatTransaction({
    id: "tx-1",
    action: "TRANSFER",
    asset: "USDC",
    amount: { toString: () => "5" },
    recipientInput: "Hurain",
    recipientAddress: "GABC123",
    status: "SUCCESS",
    policyDecision: "AUTO_EXECUTE",
    stellarTransactionHash: "hash-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    completedAt: new Date("2026-01-01T00:00:01.000Z"),
  }),
  {
    id: "tx-1",
    action: "TRANSFER",
    asset: "USDC",
    amount: "5",
    recipientInput: "Hurain",
    recipientAddress: "GABC123",
    status: "SUCCESS",
    policyDecision: "AUTO_EXECUTE",
    rejectionReason: null,
    stellarTransactionHash: "hash-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:01.000Z",
  },
);

const ambiguous = mapPay3Error(
  new RecipientError("RECIPIENT_AMBIGUOUS", 'Multiple contacts match "Hurain".'),
);
assert.equal(ambiguous.isError, true);
assert.match(ambiguous.content[0]!.text!, /Multiple contacts/);

assert.equal(toolError("boom").isError, true);

const previousToken = process.env.PAY3_MCP_AUTH_TOKEN;
process.env.PAY3_MCP_AUTH_TOKEN = "test-token-with-enough-length";
assert.equal(requireMcpAuthToken(), "test-token-with-enough-length");
delete process.env.PAY3_MCP_AUTH_TOKEN;
assert.throws(() => requireMcpAuthToken(), /PAY3_MCP_AUTH_TOKEN is missing/);
if (previousToken) {
  process.env.PAY3_MCP_AUTH_TOKEN = previousToken;
}

console.log("mcp-self-check passed");
