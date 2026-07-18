"use client";

import { useEffect, useRef, useState } from "react";
import {
  claimQrLogin,
  connectFreighter,
  pollQrLoginStatus,
  signInWithWallet,
  startQrLogin,
} from "@/lib/wallet";
import { LoginQr } from "./LoginQr";

type ConnectWalletProps = {
  onConnected: (publicKey: string) => void;
};

type Mode = "choose" | "qr";

export function ConnectWallet({ onConnected }: ConnectWalletProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [qrHint, setQrHint] = useState("Waiting for phone…");
  const claimed = useRef(false);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const publicKey = await connectFreighter();
      const user = await signInWithWallet(publicKey);
      onConnected(user.publicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartQr() {
    setLoading(true);
    setError(null);
    claimed.current = false;
    try {
      const session = await startQrLogin();
      setQrId(session.id);
      // Prefer public site for the QR so phones don't need the same Wi‑Fi.
      // Local Freighter test uses "Open login link on this device" (same origin).
      const publicOrigin = (
        process.env.NEXT_PUBLIC_QR_ORIGIN ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        ""
      ).replace(/\/$/, "");
      const usePublic =
        publicOrigin.startsWith("https://") &&
        !publicOrigin.includes("localhost");
      setQrUrl(
        usePublic
          ? `${publicOrigin}/login/qr/${session.id}`
          : session.url
      );
      setMode("qr");
      setQrHint(
        usePublic
          ? "Use your phone camera (Safari/Chrome) — not the Freighter app scanner. Then WalletConnect or open the link on this PC with Freighter."
          : "Local QR needs the same Wi‑Fi, or use “Open login link on this device” with Freighter on this PC."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start QR login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode !== "qr" || !qrId) return;

    const timer = setInterval(async () => {
      try {
        const status = await pollQrLoginStatus(qrId);
        if (status.status === "expired") {
          setError("QR expired — start again");
          setMode("choose");
          return;
        }
        if (status.status === "approved" && status.claimToken && !claimed.current) {
          claimed.current = true;
          setQrHint("Signing you in on this device…");
          const user = await claimQrLogin(qrId, status.claimToken);
          onConnected(user.publicKey);
        }
      } catch {
        /* keep polling */
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [mode, qrId, onConnected]);

  return (
    <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
        Connect wallet
      </h1>
      <p className="mt-3 text-sm text-white/60">
        Sign in with your Stellar wallet. Pay3 never stores your primary private key.
      </p>

      {mode === "choose" ? (
        <>
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="btn-primary mt-8 w-full disabled:opacity-50"
          >
            {loading ? "Connecting…" : "Connect Freighter"}
          </button>
          <button
            type="button"
            onClick={handleStartQr}
            disabled={loading}
            className="mt-3 w-full rounded-full border border-white/20 px-4 py-3 text-sm text-white/90 transition hover:border-white/40 disabled:opacity-50"
          >
            Scan with phone
          </button>
        </>
      ) : (
        <div className="mt-8 space-y-4">
          {qrUrl ? <LoginQr url={qrUrl} /> : null}
          <p className="text-sm text-white/60">{qrHint}</p>
          {qrUrl ? (
            <p className="break-all text-xs text-white/35">{qrUrl}</p>
          ) : null}
          {qrId ? (
            <a
              href={`/login/qr/${qrId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block w-full rounded-full border border-white/20 px-4 py-3 text-sm text-white/90 transition hover:border-white/40"
            >
              Open login link on this device
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setMode("choose");
              setQrId(null);
              setQrUrl(null);
              setError(null);
            }}
            className="text-sm text-white/50 underline-offset-2 hover:underline"
          >
            Back
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
