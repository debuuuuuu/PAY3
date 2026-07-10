import { createHash } from "node:crypto";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { AuthError } from "./errors.js";
import { normalizeWalletAddress } from "./network.js";

/** SEP-53: SHA256("Stellar Signed Message:\\n" + message) */
function sep53MessageHash(message: string): Buffer {
  return createHash("sha256")
    .update(Buffer.from(`Stellar Signed Message:\n${message}`, "utf8"))
    .digest();
}

export function assertValidWalletAddress(walletAddress: string): string {
  const normalized = normalizeWalletAddress(walletAddress);

  if (!StrKey.isValidEd25519PublicKey(normalized)) {
    throw new AuthError(
      "INVALID_WALLET_ADDRESS",
      "Wallet address must be a valid Stellar Ed25519 public key (G...).",
    );
  }

  return normalized;
}

export function parseSignature(signature: string): Buffer {
  const trimmed = signature.trim();

  if (/^[0-9a-fA-F]{128}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const decoded = Buffer.from(trimmed, "base64");
  if (decoded.length === 64) {
    return decoded;
  }

  throw new AuthError(
    "INVALID_SIGNATURE",
    "Signature must be a 64-byte ed25519 value encoded as base64 or 128-char hex.",
  );
}

export function verifyWalletSignature(input: {
  walletAddress: string;
  message: string;
  signature: string;
}): void {
  const walletAddress = assertValidWalletAddress(input.walletAddress);
  const signatureBytes = parseSignature(input.signature);
  const messageBytes = Buffer.from(input.message, "utf8");

  let keypair: Keypair;
  try {
    keypair = Keypair.fromPublicKey(walletAddress);
  } catch {
    throw new AuthError("INVALID_WALLET_ADDRESS", "Unable to parse wallet public key.");
  }

  // Freighter signMessage uses SEP-53; keep raw verify for programmatic/self-check signatures.
  const valid =
    keypair.verify(messageBytes, signatureBytes) ||
    keypair.verify(sep53MessageHash(input.message), signatureBytes);
  if (!valid) {
    throw new AuthError(
      "INVALID_SIGNATURE",
      "Wallet signature does not match the authentication challenge.",
    );
  }
}
