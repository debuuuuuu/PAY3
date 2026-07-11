"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revokeAllAiAccess() {
    const ok = window.confirm(
      "Revoke ALL AI sessions now?\n\nMCP tokens stop working immediately. This cannot be undone — create new sessions to reconnect."
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<{ revoked: number }>("/sessions/revoke-all", {
        method: "POST",
      });
      setMessage(
        data.revoked === 0
          ? "No active sessions to revoke."
          : `Revoked ${data.revoked} AI session${data.revoked === 1 ? "" : "s"}.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Account controls. Emergency actions take effect immediately on the
          server — AI clients lose access as soon as sessions are revoked.
        </p>
      </div>

      <section className="max-w-xl space-y-4 border border-red-500/25 bg-red-500/[0.04] p-6">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-red-200">
          Emergency — revoke all AI access
        </h2>
        <p className="text-sm text-white/60">
          Kills every active AI session and invalidates their MCP tokens. Use
          this if a token leaked or an assistant is acting outside what you
          intended.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={revokeAllAiAccess}
          className="rounded-lg border border-red-400/50 bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-100 hover:bg-red-500/25 disabled:opacity-50"
        >
          {busy ? "Revoking…" : "REVOKE ALL AI ACCESS"}
        </button>
        {message ? (
          <p className="text-sm text-white/70" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
