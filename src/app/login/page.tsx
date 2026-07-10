"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  ensureFreighter,
  freighterSignChallenge,
  getFreighterStatus,
  scanForFreighter,
  FREIGHTER_INSTALL_URL,
  type FreighterStatus,
} from "@/lib/freighter";
import { FreighterQr } from "@/components/dashboard/FreighterQr";
import { Pay3Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<FreighterStatus | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  const statusLabel = useMemo(() => {
    if (!status) return "Checking Freighter…";
    if (status.installed && status.address) {
      return `Ready · ${status.address.slice(0, 4)}…${status.address.slice(-4)}`;
    }
    if (status.installed) return "Freighter found · not connected yet";
    return "Freighter not detected";
  }, [status]);

  useEffect(() => {
    setPageUrl(window.location.href);
    void getFreighterStatus()
      .then(setStatus)
      .catch(() =>
        setStatus({
          installed: false,
          allowed: false,
          address: null,
          platform: "unknown",
        }),
      );
  }, []);

  async function loginWithFreighter() {
    setBusy(true);
    setError(null);
    try {
      const walletAddress = await ensureFreighter();
      setStatus(await getFreighterStatus());
      const challenge = await apiFetch<{
        nonce: string;
        message: string;
      }>("/api/auth/challenge", {
        method: "POST",
        body: JSON.stringify({ walletAddress }),
      });
      const signature = await freighterSignChallenge(challenge.message);
      await apiFetch("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          walletAddress,
          nonce: challenge.nonce,
          signature,
        }),
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function scanAndConnect() {
    setScanning(true);
    setError(null);
    try {
      const found = await scanForFreighter(45_000, 1_200, setStatus);
      setStatus(found);
      setScanning(false);
      await loginWithFreighter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
      setShowQr(true);
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-pay3-black text-pay3-white flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_55%)] pointer-events-none" />
      <header className="relative z-10 px-6 py-6">
        <Link href="/">
          <Pay3Logo className="h-8 w-auto" />
        </Link>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">
          <p className="font-display text-4xl tracking-tight mb-3">Connect Freighter</p>
          <p className="text-pay3-gray-400 text-sm leading-relaxed mb-2">
            Sign in with a one-time challenge. Your primary private key never leaves the wallet.
          </p>
          <p className="text-xs text-pay3-gray-400 mb-2 leading-relaxed">
            Local HTTP tip: if Freighter says the connection is not secure, enable insecure
            domains under <span className="text-white/80">Settings → Security → Advanced</span>,
            then retry.
          </p>
          <p className="text-xs font-mono text-pay3-gray-400 mb-8">{statusLabel}</p>

          <div className="space-y-3">
            <button
              type="button"
              disabled={busy || scanning}
              onClick={() => void loginWithFreighter()}
              className="w-full rounded-full bg-white text-black font-medium py-3.5 disabled:opacity-50 hover:bg-pay3-gray-100 transition"
            >
              {busy ? "Waiting for Freighter…" : "Connect Freighter"}
            </button>

            <button
              type="button"
              disabled={busy || scanning}
              onClick={() => void scanAndConnect()}
              className="w-full rounded-full border border-white/20 font-medium py-3.5 disabled:opacity-50 hover:bg-white/5 transition"
            >
              {scanning ? "Scanning for Freighter…" : "Scan & connect Freighter"}
            </button>

            <button
              type="button"
              disabled={busy || scanning}
              onClick={() => setShowQr((v) => !v)}
              className="w-full rounded-full border border-white/10 text-sm text-pay3-gray-400 py-3 hover:text-white hover:bg-white/5 transition"
            >
              {showQr ? "Hide QR code" : "Show QR for Freighter Mobile"}
            </button>
          </div>

          {showQr ? (
            <div className="mt-6 flex flex-col items-center gap-3 border border-white/10 rounded-2xl p-5">
              <FreighterQr url={pageUrl || "http://localhost:3000/login"} />
              <p className="text-xs text-pay3-gray-400 text-center leading-relaxed">
                Scan with your phone camera, then open the link in{" "}
                <strong className="text-white">Freighter Mobile</strong>’s in-app browser and tap
                Connect Freighter.
              </p>
              <a
                href={FREIGHTER_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-pay3-gray-400 hover:text-white"
              >
                Get Freighter
              </a>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-red-300 font-mono" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
