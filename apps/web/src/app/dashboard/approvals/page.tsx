"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApprovalView } from "@pay3/shared";
import { apiFetch } from "@/lib/api";
import { truncateKey } from "@/lib/wallet";

function secondsLeft(expiresAt: string, nowMs: number): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - nowMs) / 1000));
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    const data = await apiFetch<{ approvals: ApprovalView[] }>("/approvals");
    setApprovals(data.approvals);
  }, []);

  useEffect(() => {
    refresh().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
  }, [refresh]);

  // Live countdown + expire refresh
  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const poll = window.setInterval(() => {
      refresh().catch(() => {});
    }, 15_000);
    return () => window.clearInterval(poll);
  }, [refresh]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/approvals/${id}/approve`, { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/approvals/${id}/reject`, { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  const pending = approvals.filter(
    (a) => a.status === "pending" && secondsLeft(a.expiresAt, nowMs) > 0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Pending approvals
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Transfers above your session approval threshold wait here. They expire
          after two minutes if you do nothing.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {pending.length === 0 ? (
        <p className="text-sm text-white/50">No pending approvals.</p>
      ) : (
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {pending.map((a) => {
            const left = secondsLeft(a.expiresAt, nowMs);
            const urgent = left <= 30;
            return (
              <li
                key={a.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm">
                    {a.transaction?.amount} {a.transaction?.asset} →{" "}
                    {a.transaction?.recipient
                      ? truncateKey(a.transaction.recipient)
                      : "—"}
                  </p>
                  <p
                    className={`mt-1 font-[family-name:var(--font-jetbrains-mono)] text-xs ${
                      urgent ? "text-amber-300" : "text-white/40"
                    }`}
                  >
                    Expires in {formatCountdown(left)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === a.id || left === 0}
                    onClick={() => approve(a.id)}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === a.id || left === 0}
                    onClick={() => reject(a.id)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {approvals.length > pending.length ? (
        <div>
          <h2 className="mb-2 text-xs uppercase tracking-wide text-white/40">
            Recent
          </h2>
          <ul className="space-y-1 text-sm text-white/50">
            {approvals
              .filter((a) => a.status !== "pending" || secondsLeft(a.expiresAt, nowMs) === 0)
              .slice(0, 10)
              .map((a) => (
                <li key={a.id}>
                  {a.status === "pending" ? "expired" : a.status} ·{" "}
                  {a.transaction?.amount} {a.transaction?.asset}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
