"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionView } from "@pay3/shared";
import { apiFetch } from "@/lib/api";

type EvalResult = {
  decision: "AUTO_EXECUTE" | "PENDING_APPROVAL" | "REJECTED";
  reason: string;
  checks: string[];
  spentToday: string;
  clientType: string;
};

export default function PoliciesPage() {
  const [sessions, setSessions] = useState<SessionView[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [action, setAction] = useState("transfer");
  const [asset, setAsset] = useState("XLM");
  const [amount, setAmount] = useState("10");
  const [recipient, setRecipient] = useState("Alex");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadSessions = useCallback(async () => {
    const data = await apiFetch<{ sessions: SessionView[] }>("/sessions");
    const active = data.sessions.filter((s) => s.active);
    setSessions(active);
    if (active[0] && !sessionId) setSessionId(active[0].id);
  }, [sessionId]);

  useEffect(() => {
    loadSessions().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load sessions")
    );
  }, [loadSessions]);

  async function evaluate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<EvalResult>("/policy/evaluate", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          action,
          asset: action === "transfer" ? asset : undefined,
          amount: action === "transfer" ? amount : undefined,
          recipient: action === "transfer" ? recipient : undefined,
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluate failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendTransfer(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setTransferMsg(null);
    try {
      const data = await apiFetch<{
        transaction: { id: string; status: string; stellarTransactionHash: string | null };
        approval?: { id: string };
      }>("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          recipient,
          asset,
          amount,
        }),
      });
      if (data.transaction.status === "PENDING_APPROVAL") {
        setTransferMsg(
          `Pending approval — open Approvals (id ${data.approval?.id ?? "…"})`
        );
      } else if (data.transaction.status === "SUCCESS") {
        setTransferMsg(
          `Success · tx ${data.transaction.stellarTransactionHash}`
        );
      } else {
        setTransferMsg(`Status: ${data.transaction.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSending(false);
    }
  }

  const decisionColor =
    result?.decision === "AUTO_EXECUTE"
      ? "text-white"
      : result?.decision === "PENDING_APPROVAL"
        ? "text-amber-300"
        : "text-red-400";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Policies
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Off-chain three-level engine: AUTO_EXECUTE, PENDING_APPROVAL, or
          REJECTED. You can also send a real testnet XLM transfer from here.
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-white/50">
          No active sessions. Create one under Sessions first.
        </p>
      ) : (
        <form
          onSubmit={evaluate}
          className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
            Test policy evaluation
          </h2>

          <label className="block text-sm">
            <span className="text-white/50">Session</span>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label ?? s.clientType} ({s.clientType})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Action</span>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="get_balance">get_balance</option>
              <option value="transfer">transfer</option>
              <option value="get_transaction_history">
                get_transaction_history
              </option>
            </select>
          </label>

          {action === "transfer" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="text-white/50">Asset</span>
                <input
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/50">Amount</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/50">Recipient</span>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Alex or G…"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                />
              </label>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy || !sessionId}
            className="btn-primary disabled:opacity-50"
          >
            {busy ? "Evaluating…" : "Evaluate"}
          </button>
        </form>
      )}

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="max-w-xl space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <p className={`font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold ${decisionColor}`}>
            {result.decision}
          </p>
          <p className="text-sm text-white/70">{result.reason}</p>
          <p className="text-xs text-white/40">
            Spent today: {result.spentToday} · Session: {result.clientType}
          </p>
          <ul className="mt-2 space-y-1 font-[family-name:var(--font-jetbrains-mono)] text-xs text-white/50">
            {result.checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {sessions.length > 0 ? (
        <form
          onSubmit={sendTransfer}
          className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
            Send testnet transfer
          </h2>
          <p className="text-sm text-white/50">
            Uses your linked allocation account. Recipient must be a saved
            contact name or G-address. Only XLM for now.
          </p>
          <button
            type="submit"
            disabled={sending || !sessionId}
            className="btn-primary disabled:opacity-50"
          >
            {sending ? "Submitting…" : `Send ${amount} ${asset} to ${recipient || "…"}`}
          </button>
          {transferMsg ? (
            <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white/80">
              {transferMsg}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
