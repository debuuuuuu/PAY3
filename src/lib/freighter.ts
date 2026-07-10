"use client";

import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signMessage,
} from "@stellar/freighter-api";

export type FreighterStatus = {
  installed: boolean;
  allowed: boolean;
  address: string | null;
  platform: "extension" | "mobile" | "unknown";
};

function detectPlatform(): FreighterStatus["platform"] {
  if (typeof window === "undefined") return "unknown";
  const stellar = (window as Window & { stellar?: { platform?: string } }).stellar;
  if (stellar?.platform === "mobile") return "mobile";
  return "unknown";
}

export async function getFreighterStatus(): Promise<FreighterStatus> {
  const connected = await isConnected();
  if (!connected.isConnected) {
    return {
      installed: false,
      allowed: false,
      address: null,
      platform: detectPlatform(),
    };
  }

  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    return {
      installed: true,
      allowed: false,
      address: null,
      platform: detectPlatform() === "unknown" ? "extension" : detectPlatform(),
    };
  }

  const address = await getAddress();
  return {
    installed: true,
    allowed: true,
    address: address.address ?? null,
    platform: detectPlatform() === "unknown" ? "extension" : detectPlatform(),
  };
}

/** Poll until Freighter appears (user installs/enables extension) or timeout. */
export async function scanForFreighter(
  timeoutMs = 45_000,
  intervalMs = 1_200,
  onTick?: (status: FreighterStatus) => void,
): Promise<FreighterStatus> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getFreighterStatus();
    onTick?.(status);
    if (status.installed) {
      return status;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    "Freighter not found. Install the extension, or open this page in Freighter Mobile and try again.",
  );
}

export async function ensureFreighter(): Promise<string> {
  const status = await getFreighterStatus();
  if (!status.installed) {
    throw new Error(
      "Freighter not found. Use Scan for Freighter, install the extension, or open this URL in Freighter Mobile.",
    );
  }

  if (!status.allowed || !status.address) {
    const access = await requestAccess();
    if (access.error || !access.address) {
      throw new Error(
        typeof access.error === "string"
          ? access.error
          : access.error?.message ?? "Freighter access denied.",
      );
    }
    return access.address;
  }

  return status.address;
}

export async function freighterSignChallenge(message: string): Promise<string> {
  const address = await ensureFreighter();
  const signed = await signMessage(message, { address });
  if (signed.error || signed.signedMessage == null) {
    throw new Error(
      typeof signed.error === "string"
        ? signed.error
        : signed.error?.message ?? "Freighter signature failed.",
    );
  }

  const sig = signed.signedMessage;
  if (typeof sig === "string") {
    return sig;
  }
  const bytes = Uint8Array.from(sig as Uint8Array);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export const FREIGHTER_INSTALL_URL =
  "https://www.freighter.app/";
