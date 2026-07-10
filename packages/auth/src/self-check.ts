import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { buildAuthChallengeMessage } from "./challenge-message.js";
import { AuthError } from "./errors.js";
import { parseSignature, verifyWalletSignature } from "./signature.js";
import { generateChallengeNonce, hashSessionToken } from "./tokens.js";

const keypair = Keypair.random();
const walletAddress = keypair.publicKey();
const nonce = generateChallengeNonce();
const issuedAt = new Date("2026-01-01T00:00:00.000Z");
const expiresAt = new Date("2026-01-01T00:05:00.000Z");

const message = buildAuthChallengeMessage({
  walletAddress,
  network: "testnet",
  nonce,
  issuedAt,
  expiresAt,
});

const signature = keypair.sign(Buffer.from(message, "utf8")).toString("base64");

verifyWalletSignature({ walletAddress, message, signature });

// Freighter / SEP-53: sign SHA256("Stellar Signed Message:\\n" + message)
{
  const hash = createHash("sha256")
    .update(Buffer.from(`Stellar Signed Message:\n${message}`, "utf8"))
    .digest();
  const sep53Sig = keypair.sign(hash).toString("base64");
  verifyWalletSignature({ walletAddress, message, signature: sep53Sig });
}
assert.throws(
  () =>
    verifyWalletSignature({
      walletAddress,
      message,
      signature: Keypair.random().sign(Buffer.from(message, "utf8")).toString("base64"),
    }),
  AuthError,
);

const hexSignature = keypair.sign(Buffer.from(message, "utf8")).toString("hex");
assert.equal(parseSignature(hexSignature).length, 64);

const token = "session-token-example";
const hashA = hashSessionToken(token, "secret-a");
const hashB = hashSessionToken(token, "secret-b");
assert.notEqual(hashA, hashB);
assert.equal(hashA, hashSessionToken(token, "secret-a"));

console.log("pay3 auth self-check passed");
