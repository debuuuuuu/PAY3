import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AiClientType,
  AiSessionStatus,
  ApprovalStatus,
  AuditActor,
  BudgetPeriodType,
  IdempotencyStatus,
  PolicyDecision,
  PolicyPreset,
  Prisma,
  StellarNetwork,
  TransactionAction,
  TransactionStatus,
} from "@prisma/client";
import { buildPolicySnapshot } from "./policy-snapshot.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

const requiredModels = [
  "User",
  "Wallet",
  "AuthChallenge",
  "WalletSession",
  "SmartAccount",
  "Policy",
  "AiSession",
  "Contact",
  "Transaction",
  "ApprovalRequest",
  "IdempotencyRecord",
  "BudgetUsage",
  "UsageRecord",
  "AuditLog",
];

for (const model of requiredModels) {
  assert.match(schema, new RegExp(`model ${model} \\{`));
}

assert.equal(StellarNetwork.TESTNET, "TESTNET");
assert.equal(PolicyPreset.BALANCED, "BALANCED");
assert.equal(AiClientType.CLAUDE, "CLAUDE");
assert.equal(AiSessionStatus.ACTIVE, "ACTIVE");
assert.equal(PolicyDecision.AUTO_EXECUTE, "AUTO_EXECUTE");
assert.equal(PolicyDecision.PENDING_APPROVAL, "PENDING_APPROVAL");
assert.equal(TransactionStatus.EXPIRED, "EXPIRED");
assert.equal(TransactionStatus.CANCELLED, "CANCELLED");
assert.equal(ApprovalStatus.EXPIRED, "EXPIRED");
assert.equal(IdempotencyStatus.IN_PROGRESS, "IN_PROGRESS");
assert.equal(TransactionAction.TRANSFER, "TRANSFER");
assert.equal(BudgetPeriodType.DAILY, "DAILY");
assert.equal(AuditActor.AI_SESSION, "AI_SESSION");

const snapshot = buildPolicySnapshot({
  id: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000002",
  name: "Balanced",
  preset: PolicyPreset.BALANCED,
  dailyBudget: new Prisma.Decimal("500"),
  monthlyBudget: null,
  perTransactionMax: new Prisma.Decimal("100"),
  manualApprovalThreshold: new Prisma.Decimal("250"),
  sessionDurationHours: 168,
  allowedAssets: ["USDC"],
  allowedActions: ["TRANSFER", "CHECK_BALANCE"],
  allowedProtocols: [],
  allowedContracts: [],
  allowedRecipientIds: [],
  rateLimitPerMinute: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

assert.equal(snapshot.dailyBudget, "500");
assert.equal(snapshot.allowedAssets[0], "USDC");

console.log("pay3 database self-check passed");
