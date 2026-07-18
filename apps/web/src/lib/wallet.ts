import {
  isConnected,
  requestAccess,
  signMessage,
  signTransaction,
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

export function normalizeWalletSignature(
  signedMessage: string | Buffer | Uint8Array
): string {
  if (typeof signedMessage === "string") return signedMessage;
  return Buffer.from(signedMessage).toString("base64");
}

async function signAuthMessage(
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

  return normalizeWalletSignature(signed.signedMessage);
}

/** Challenge + Freighter sign; returns payload for /auth/verify or /auth/qr/.../complete */
export async function challengeAndSignWithFreighter(publicKey: string): Promise<{
  publicKey: string;
  nonce: string;
  signature: string;
}> {
  const challenge = await apiFetch<AuthChallengeResponse>("/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ publicKey }),
  });

  const signature = await signAuthMessage(challenge.message, publicKey);
  return { publicKey, nonce: challenge.nonce, signature };
}

export async function signInWithWallet(publicKey: string): Promise<AuthUser> {
  const signed = await challengeAndSignWithFreighter(publicKey);

  const verified = await apiFetch<{ user: AuthUser }>("/auth/verify", {
    method: "POST",
    body: JSON.stringify(signed),
  });

  return verified.user;
}

/** Phone path: complete QR room instead of setting cookies on the phone */
export async function completeQrLoginWithFreighter(
  loginId: string,
  publicKey: string
): Promise<void> {
  const signed = await challengeAndSignWithFreighter(publicKey);
  await apiFetch<{ ok: boolean }>(`/auth/qr/${loginId}/complete`, {
    method: "POST",
    body: JSON.stringify(signed),
  });
}

/** Complete QR after an external wallet already produced a SEP-53 signature */
export async function completeQrLoginWithSignature(
  loginId: string,
  publicKey: string,
  nonce: string,
  signature: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/auth/qr/${loginId}/complete`, {
    method: "POST",
    body: JSON.stringify({
      publicKey,
      nonce,
      signature: normalizeWalletSignature(signature),
    }),
  });
}

export async function startQrLogin(): Promise<{
  id: string;
  expiresAt: string;
  url: string;
}> {
  return apiFetch("/auth/qr/start", { method: "POST", body: "{}" });
}

export async function pollQrLoginStatus(id: string): Promise<{
  status: string;
  expiresAt: string;
  claimToken?: string;
  publicKey?: string;
}> {
  return apiFetch(`/auth/qr/${id}/status`);
}

export async function claimQrLogin(
  id: string,
  claimToken: string
): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>(`/auth/qr/${id}/claim`, {
    method: "POST",
    body: JSON.stringify({ claimToken }),
  });
  return data.user;
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
  return signAuthMessage(message, publicKey);
}

/** Sign a Soroban/classic transaction XDR (add_session / revoke_session). */
export async function signTransactionWithFreighter(
  unsignedXdr: string,
  publicKey: string
): Promise<string> {
  const signed = await signTransaction(unsignedXdr, {
    address: publicKey,
    networkPassphrase:
      process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
      "Test SDF Network ; September 2015",
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error ?? "Freighter transaction signing failed");
  }
  return signed.signedTxXdr;
}
