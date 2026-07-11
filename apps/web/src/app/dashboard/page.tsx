"use client";

import { useCallback, useEffect, useState } from "react";
import type { SmartAccountView, UsageView, UserProfile } from "@pay3/shared";
import { AddressQr } from "@/components/dashboard/AddressQr";
import { apiFetch } from "@/lib/api";
import { fetchCurrentUser, truncateKey } from "@/lib/wallet";

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<SmartAccountView | null>(null);
  const [usage, setUsage] = useState<UsageView | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const [user, sa, usageRes] = await Promise.all([
      fetchCurrentUser(),
      apiFetch<{ smartAccount: SmartAccountView | null }>("/smart-account").catch(
        () => ({ smartAccount: null })
      ),
      apiFetch<{ usage: UsageView }>("/usage").catch(() => ({ usage: null })),
    ]);
    setProfile(user);
    setAccount(sa.smartAccount);
    setUsage(usageRes.usage);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleLink() {
    setLinking(true);
    setError(null);
    try {
      await apiFetch("/smart-account/link", { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed");
    } finally {
      setLinking(false);
    }
  }

  async function copyAddress() {
    if (!account?.publicKey) return;
    await navigator.clipboard.writeText(account.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const linked = Boolean(account?.publicKey && account.status !== "pending");
  const storageLabel =
    profile?.storage === "database"
      ? `PostgreSQL (${profile.storageProvider ?? "cloud"})`
      : "memory — configure Neon (docs/DATABASE.md)";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Data in{" "}
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-white/80">
            {storageLabel}
          </span>
          . Allocate limited funds to your smart account for AI operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Smart account",
            value: linked
              ? truncateKey(account!.publicKey!)
              : account?.status ?? "Not linked",
          },
          {
            label: "Allocated balance",
            value: linked ? `${account?.xlmBalance ?? "0"} XLM` : "—",
          },
          {
            label: "Active sessions",
            value: profile ? String(profile.activeSessions) : "…",
          },
          {
            label: usage ? `Usage ${usage.month}` : "Monthly usage",
            value: usage
              ? `${usage.txCount} tx · ${usage.volume} ${usage.asset}`
              : "…",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-white/40">
              {card.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-jetbrains-mono)] text-lg">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {!linked ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
            Link smart account
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Creates a dedicated Stellar testnet allocation account. Your primary
            Freighter key stays in your wallet — Pay3 never stores it. The
            allocation secret is encrypted at rest and never sent to the browser.
          </p>
          <button
            type="button"
            onClick={handleLink}
            disabled={linking}
            className="btn-primary mt-6 disabled:opacity-50"
          >
            {linking ? "Creating on testnet…" : "Link smart account"}
          </button>
          {error ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
            Fund allocation account
          </h2>
          <p className="text-sm text-white/60">
            Scan the QR with a Stellar wallet or copy the address and send from
            Freighter. Only funds here are available for future AI sessions.
          </p>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {account?.publicKey ? (
                <AddressQr publicKey={account.publicKey} />
              ) : null}
              <p className="mt-2 max-w-[200px] text-center text-xs text-white/40">
                Scan to get the address
              </p>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-white/90">
                  {account?.publicKey}
                </code>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <ol className="list-decimal space-y-1 pl-5 text-sm text-white/50">
                <li>Scan QR or paste address in Freighter (Testnet)</li>
                <li>Send XLM to the allocation account</li>
                <li>
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="underline hover:text-white"
                  >
                    Refresh balances
                  </button>
                </li>
              </ol>
            </div>
          </div>

          {account?.balances && account.balances.length > 0 ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-wide text-white/40">
                Balances
              </p>
              <ul className="mt-2 space-y-1 font-[family-name:var(--font-jetbrains-mono)] text-sm">
                {account.balances.map((b) => (
                  <li key={b.asset}>
                    {b.balance} {b.asset}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
