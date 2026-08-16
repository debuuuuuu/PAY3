import {
  isConnected,
  requestAccess,
  signMessage,
  signTransaction,
} from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { apiFetch } from "./api";
import { HORIZON_URL, STELLAR_NETWORK } from "./network";
import type { AuthChallengeResponse, AuthUser, UserProfile } from "@pay3/shared";

/** Freighter/API sometimes returns `{ message, code }` instead of a string. */
export function formatUnknownError(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "[object Object]" ? fallback : trimmed || fallback;
  }
  if (value instanceof Error) {
    const trimmed = value.message.trim();
    return trimmed === "[object Object]" ? fallback : trimmed || fallback;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["message", "error", "detail", "reason", "description"]) {
      const nested = record[key];
      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
    if (typeof record.code === "string" && record.code.trim()) {
      return record.code.replace(/_/g, " ");
    }
  }
  return fallback;
}

function freighterIsConnected(
  result: Awaited<ReturnType<typeof isConnected>>
): boolean {
  if (typeof result === "boolean") return result;
  return Boolean(result.isConnected);
}

export async function connectFreighter(): Promise<string> {
  const connected = freighterIsConnected(await isConnected());
  if (!connected) {
    if (isInsecureHttpOrigin()) {
      throw new Error(
        "Freighter blocked this http:// site. Open Freighter → Settings → Preferences → Advanced → allow non-HTTPS connections, then refresh. Or use https://paythreewallet.vercel.app"
      );
    }
    throw new Error("Freighter extension not installed");
  }

  const access = await requestAccess();
  if (access.error || !access.address) {
    const detail = formatUnknownError(access.error, "Freighter access denied");
    if (
      isInsecureHttpOrigin() &&
      /ssl|https|secure|certificate|insecure/i.test(detail)
    ) {
      throw new Error(
        "Freighter blocked this http:// site. Open Freighter → Settings → Preferences → Advanced → allow non-HTTPS connections, then refresh. Or use https://paythreewallet.vercel.app"
      );
    }
    throw new Error(detail);
  }

  return access.address;
}

export type FreighterIssue = "missing" | "denied" | "insecure" | "other";

function isInsecureHttpOrigin(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "http:";
}

export function classifyFreighterError(message: string): FreighterIssue {
  const m = message.toLowerCase();
  if (
    m.includes("http://") ||
    m.includes("non-https") ||
    m.includes("ssl") ||
    m.includes("not secure") ||
    m.includes("certificate")
  ) {
    return "insecure";
  }
  if (
    m.includes("not installed") ||
    m.includes("extension") ||
    m.includes("no freighter")
  ) {
    return "missing";
  }
  if (
    m.includes("denied") ||
    m.includes("rejected") ||
    m.includes("cancel") ||
    m.includes("declined")
  ) {
    return "denied";
  }
  return "other";
}

export async function isFreighterAvailable(): Promise<boolean> {
  try {
    return freighterIsConnected(await isConnected());
  } catch {
    return false;
  }
}

export const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

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
    throw new Error(formatUnknownError(signed.error, "Signing failed"));
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

/**
 * Fund the AI jar directly from the primary Freighter wallet.
 * New testnet jars are not on Horizon until the first createAccount —
 * so we use createAccount when the destination is missing (min 1 XLM).
 */
export async function fundJarFromFreighter(
  destination: string,
  amountXlm: string,
  sourcePublicKey: string
): Promise<string> {
  const amount = Number(amountXlm);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter an amount greater than 0");
  }
  // XLM supports 7 decimal places; keep the string Horizon-friendly.
  const amountStr = amount.toFixed(7).replace(/\.?0+$/, "");

  const server = new Horizon.Server(HORIZON_URL);
  let source;
  try {
    source = await server.loadAccount(sourcePublicKey);
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) {
      throw new Error(
        "Your Freighter account is not on testnet yet (or Freighter is on the wrong network). Switch Freighter to Testnet and fund it first."
      );
    }
    throw err;
  }

  let destinationExists = true;
  try {
    await server.loadAccount(destination);
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) destinationExists = false;
    else throw err;
  }

  // ponytail: first fund must createAccount; Stellar min ≈ 1 XLM base reserve
  if (!destinationExists && amount < 1) {
    throw new Error(
      "This jar is new on testnet — send at least 1 XLM the first time to create the account."
    );
  }

  const op = destinationExists
    ? Operation.payment({
        destination,
        asset: Asset.native(),
        amount: amountStr,
      })
    : Operation.createAccount({
        destination,
        startingBalance: amountStr,
      });

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK,
  })
    .addOperation(op)
    .setTimeout(120)
    .build();

  const signedXdr = await signTransactionWithFreighter(
    tx.toXDR(),
    sourcePublicKey
  );
  const signed = TransactionBuilder.fromXDR(signedXdr, STELLAR_NETWORK);
  try {
    const result = await server.submitTransaction(signed);
    return result.hash;
  } catch (err: unknown) {
    const detail =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string; title?: string; extras?: { result_codes?: unknown } } } })
            .response?.data
        : undefined;
    if (detail?.detail || detail?.title) {
      throw new Error(
        detail.detail ?? detail.title ?? "Horizon rejected the funding transaction"
      );
    }
    throw err;
  }
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
    throw new Error(
      formatUnknownError(signed.error, "Freighter transaction signing failed")
    );
  }
  return signed.signedTxXdr;
}
