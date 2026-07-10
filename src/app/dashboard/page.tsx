"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type DashboardSummary = {
  wallet: {
    wallet: { publicAddress: string };
    balances: Array<{ asset: string; balance: string }>;
    smartAccounts: Array<{ id: string; contractId: string }>;
  };
  recentTransactions: unknown[];
  activeSessions: unknown[];
  pendingApprovals: unknown[];
  policies: unknown[];
  monthlyUsage: { totalsByAsset?: Record<string, { totalAmount: string; transactionCount: number }> };
  budgetUsage: { sessions: unknown[] };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function load() {
    try {
      const summary = await apiFetch<DashboardSummary>("/api/dashboard");
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function revokeAll() {
    if (!confirm("Revoke all AI sessions immediately?")) return;
    setRevoking(true);
    try {
      await apiFetch("/api/ai-sessions/revoke-all", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed.");
    } finally {
      setRevoking(false);
    }
  }

  if (error && !data) {
    return <p className="text-red-300 font-mono text-sm">{error}</p>;
  }

  if (!data) {
    return <p className="text-pay3-gray-400 font-mono text-sm">Loading…</p>;
  }

  const totals = data.monthlyUsage?.totalsByAsset ?? {};

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Overview</h1>
          <p className="text-pay3-gray-400 text-sm mt-1 font-mono">
            {data.wallet.wallet.publicAddress}
          </p>
        </div>
        <button
          type="button"
          disabled={revoking}
          onClick={() => void revokeAll()}
          className="rounded-full border border-red-400/40 text-red-200 px-4 py-2 text-sm hover:bg-red-500/10 disabled:opacity-50"
        >
          {revoking ? "Revoking…" : "Emergency revoke all"}
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Balances", value: String(data.wallet.balances.length) },
          { label: "Smart accounts", value: String(data.wallet.smartAccounts.length) },
          { label: "Active sessions", value: String(data.activeSessions.length) },
          { label: "Pending approvals", value: String(data.pendingApprovals.length) },
        ].map((card) => (
          <div key={card.label} className="border border-white/10 rounded-2xl p-5">
            <p className="text-pay3-gray-400 text-xs uppercase tracking-wider">{card.label}</p>
            <p className="font-display text-3xl mt-2">{card.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Wallet balances</h2>
        <ul className="space-y-2">
          {data.wallet.balances.length === 0 ? (
            <li className="text-pay3-gray-400 text-sm">No balances found on Horizon.</li>
          ) : (
            data.wallet.balances.map((b) => (
              <li
                key={b.asset}
                className="flex justify-between border border-white/10 rounded-xl px-4 py-3 font-mono text-sm"
              >
                <span>{b.asset}</span>
                <span>{b.balance}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Monthly usage</h2>
        {Object.keys(totals).length === 0 ? (
          <p className="text-pay3-gray-400 text-sm">No spending this month.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(totals).map(([asset, row]) => (
              <li
                key={asset}
                className="flex justify-between border border-white/10 rounded-xl px-4 py-3 font-mono text-sm"
              >
                <span>{asset}</span>
                <span>
                  {row.totalAmount} · {row.transactionCount} tx
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-wrap gap-3 text-sm">
        <Link className="underline text-pay3-gray-400 hover:text-white" href="/dashboard/sessions">
          Manage AI sessions
        </Link>
        <Link className="underline text-pay3-gray-400 hover:text-white" href="/dashboard/approvals">
          Review approvals
        </Link>
        <Link className="underline text-pay3-gray-400 hover:text-white" href="/dashboard/policies">
          Edit policies
        </Link>
      </section>
    </div>
  );
}
