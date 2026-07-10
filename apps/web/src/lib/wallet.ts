import {
  isConnected,
  requestAccess,
  signMessage,
} from "@stellar/freighter-api";
import { apiFetch } from "./api";
import type { AuthChallengeResponse, AuthUser, UserProfile } from "@pay3/shared";

export async function connectFreighter(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error("Freighter extension not installed");
  }

  const access = await requestAccess();
  if (access.error || !access.address) {
    throw new Error(access.error ?? "Freighter access denied");
  }

  return access.address;
}

export async function signInWithWallet(publicKey: string): Promise<AuthUser> {
  const challenge = await apiFetch<AuthChallengeResponse>("/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ publicKey }),
  });

  const signed = await signMessage(challenge.message, {
    address: publicKey,
    networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "Test SDF Network ; September 2015",
  });

  if (signed.error || !signed.signedMessage) {
    throw new Error(signed.error ?? "Signing failed");
  }

  const signature = normalizeFreighterSignature(signed.signedMessage);

  const verified = await apiFetch<{ user: AuthUser }>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      publicKey,
      nonce: challenge.nonce,
      signature,
    }),
  });

  return verified.user;
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const data = await apiFetch<{ user: UserProfile | null }>("/auth/me");
  return data.user;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export function truncateKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 6)}…${key.slice(-6)}`;
}

export async function signMessageWithFreighter(
  message: string,
  publicKey: string
): Promise<string> {
  const signed = await signMessage(message, {
    address: publicKey,
    networkPassphrase:
      process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
      "Test SDF Network ; September 2015",
  });

  if (signed.error || !signed.signedMessage) {
    throw new Error(signed.error ?? "Signing failed");
  }

  return normalizeFreighterSignature(signed.signedMessage);
}

function normalizeFreighterSignature(
  signedMessage: string | Buffer | Uint8Array
): string {
  if (typeof signedMessage === "string") return signedMessage;
  return Buffer.from(signedMessage).toString("base64");
}
