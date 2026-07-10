import assert from "node:assert/strict";
import type { PrismaClient } from "@pay3/database";
import { Keypair } from "@stellar/stellar-sdk";
import { RecipientError } from "./errors.js";
import { resolveRecipient } from "./resolve.js";

const userId = "00000000-0000-4000-8000-000000000001";
const publicKey = Keypair.random().publicKey();

const addressPrisma = {
  contact: {
    findFirst: async () => null,
    findMany: async () => [],
  },
} as unknown as PrismaClient;

const resolved = await resolveRecipient(addressPrisma, userId, publicKey);
assert.equal(resolved.matchedBy, "address");
assert.equal(resolved.stellarAddress, publicKey.toUpperCase());

const ambiguousPrisma = {
  contact: {
    findFirst: async () => null,
    findMany: async () => [
      {
        id: "00000000-0000-4000-8000-000000000002",
        displayName: "Hurain",
        stellarAddress: Keypair.random().publicKey(),
      },
      {
        id: "00000000-0000-4000-8000-000000000003",
        displayName: "Hurain B",
        stellarAddress: Keypair.random().publicKey(),
      },
    ],
  },
} as unknown as PrismaClient;

await assert.rejects(
  () => resolveRecipient(ambiguousPrisma, userId, "Hurain"),
  (error: unknown) => {
    assert.ok(error instanceof RecipientError);
    assert.equal(error.code, "RECIPIENT_AMBIGUOUS");
    return true;
  },
);

console.log("pay3 recipient-resolver self-check passed");
