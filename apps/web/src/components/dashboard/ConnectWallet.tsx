"use client";

import { useState } from "react";
import { connectFreighter, signInWithWallet } from "@/lib/wallet";

type ConnectWalletProps = {
  onConnected: (publicKey: string) => void;
};

export function ConnectWallet({ onConnected }: ConnectWalletProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
        Connect wallet
      </h1>
      <p className="mt-3 text-sm text-white/60">
        Sign in with your Stellar wallet. Pay3 never stores your primary private key.
      </p>
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary mt-8 w-full disabled:opacity-50"
      >
        {loading ? "Connecting…" : "Connect Freighter"}
      </button>
      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
