"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionPolicyRules, SessionView } from "@pay3/shared";
import { apiFetch } from "@/lib/api";
import {
  fetchCurrentUser,
  signMessageWithFreighter,
  signTransactionWithFreighter,
  truncateKey,
} from "@/lib/wallet";

const DEFAULT_RULES: SessionPolicyRules = {
  durationHours: 24,
  dailyBudget: "100",
  asset: "XLM",
  perTxMax: "20",
  approvalAbove: "15",
  allowedActions: ["get_balance", "transfer", "get_transaction_history"],
  blockedNotes: [
    "Unknown contracts",
    "Unapproved assets",
    "Actions outside policy",
  ],
};

type Step = "list" | "form" | "review";

type Preview = {
  clientType: string;
  label: string | null;
  rules: SessionPolicyRules;
  allowed: string[];
  blocked: string[];
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionView[]>([]);
  const [step, setStep] = useState<Step>("list");
  const [clientType, setClientType] = useState("claude");
  const [label, setLabel] = useState("");
  const [rules, setRules] = useState<SessionPolicyRules>(DEFAULT_RULES);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mcpToken, setMcpToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const data = await apiFetch<{ sessions: SessionView[] }>("/sessions");
    setSessions(data.sessions);
  }, []);

  useEffect(() => {
    refresh().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
  }, [refresh]);

  async function goToReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await apiFetch<Preview>("/sessions/preview", {
        method: "POST",
        body: JSON.stringify({
          clientType,
          label: label || undefined,
          rules,
        }),
      });
      setPreview(data);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function authorize() {
    setError(null);
    setBusy(true);
    try {
      const user = await fetchCurrentUser();
      if (!user?.publicKey) throw new Error("Not signed in");

      const challenge = await apiFetch<{
        nonce: string;
        message: string;
      }>("/sessions/challenge", {
        method: "POST",
        body: JSON.stringify({
          clientType,
          label: label || undefined,
          rules,
        }),
      });

      const signature = await signMessageWithFreighter(
        challenge.message,
        user.publicKey
      );

      const created = await apiFetch<{
        session: SessionView;
        mcpToken: string;
        onchainRegister?: { unsignedXdr: string } | null;
      }>("/sessions", {
        method: "POST",
        body: JSON.stringify({
          clientType,
          label: label || undefined,
          rules,
          nonce: challenge.nonce,
          signature,
        }),
      });

      if (created.onchainRegister?.unsignedXdr) {
        const signedXdr = await signTransactionWithFreighter(
          created.onchainRegister.unsignedXdr,
          user.publicKey
        );
        await apiFetch(`/sessions/${created.session.id}/onchain-confirm`, {
          method: "POST",
          body: JSON.stringify({ signedXdr }),
        });
      }

      setMcpToken(created.mcpToken);
      setStep("list");
      setPreview(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authorize failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setError(null);
    try {
      const user = await fetchCurrentUser();
      const result = await apiFetch<{
        session: SessionView;
        onchainRevoke?: { unsignedXdr: string } | null;
      }>(`/sessions/${id}/revoke`, { method: "POST" });

      if (result.onchainRevoke?.unsignedXdr && user?.publicKey) {
        const signedXdr = await signTransactionWithFreighter(
          result.onchainRevoke.unsignedXdr,
          user.publicKey
        );
        await apiFetch(`/sessions/${id}/onchain-confirm`, {
          method: "POST",
          body: JSON.stringify({ signedXdr }),
        });
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    }
  }

  async function revokeAll() {
    const ok = window.confirm(
      "Revoke ALL AI sessions? MCP tokens stop working immediately."
    );
    if (!ok) return;
    setError(null);
    try {
      await apiFetch("/sessions/revoke-all", { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke all failed");
    }
  }

  async function copyToken() {
    if (!mcpToken) return;
    await navigator.clipboard.writeText(mcpToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "form") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <button
          type="button"
          onClick={() => setStep("list")}
          className="text-sm text-white/50 underline hover:text-white"
        >
          ← Back
        </button>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Create AI session
        </h1>
        <form onSubmit={goToReview} className="space-y-4">
          <label className="block text-sm">
            <span className="text-white/50">AI client</span>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="claude">Claude</option>
              <option value="cursor">Cursor</option>
              <option value="chatgpt">ChatGPT</option>
              <option value="other">Other MCP client</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-white/50">Label (optional)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Work laptop"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/50">Duration (hours)</span>
              <input
                type="number"
                min={1}
                max={168}
                value={rules.durationHours}
                onChange={(e) =>
                  setRules({ ...rules, durationHours: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">Asset</span>
              <input
                value={rules.asset}
                onChange={(e) => setRules({ ...rules, asset: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">Daily budget</span>
              <input
                value={rules.dailyBudget}
                onChange={(e) =>
                  setRules({ ...rules, dailyBudget: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">Per-transaction max</span>
              <input
                value={rules.perTxMax}
                onChange={(e) =>
                  setRules({ ...rules, perTxMax: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/50">Require approval above</span>
              <input
                value={rules.approvalAbove}
                onChange={(e) =>
                  setRules({ ...rules, approvalAbove: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              />
            </label>
          </div>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? "…" : "Review permissions"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "review" && preview) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <button
          type="button"
          onClick={() => setStep("form")}
          className="text-sm text-white/50 underline hover:text-white"
        >
          ← Edit
        </button>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Permission review
        </h1>
        <p className="text-sm text-white/60">
          No AI gets financial authority until you sign with Freighter.
        </p>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 font-[family-name:var(--font-jetbrains-mono)] text-sm space-y-2">
          <p>
            Create AI Session:{" "}
            <span className="text-white">{preview.clientType}</span>
          </p>
          <p>Duration: {preview.rules.durationHours} hours</p>
          <p>
            Daily budget: {preview.rules.dailyBudget} {preview.rules.asset}
          </p>
          <p>
            Per transaction: {preview.rules.perTxMax} {preview.rules.asset}
          </p>
          <p>
            Approval above: {preview.rules.approvalAbove} {preview.rules.asset}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-white/40">
              Allowed
            </p>
            <ul className="mt-3 space-y-1 text-sm text-white/80">
              {preview.allowed.map((a) => (
                <li key={a}>✓ {a}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-white/40">
              Blocked
            </p>
            <ul className="mt-3 space-y-1 text-sm text-white/80">
              {preview.blocked.map((b) => (
                <li key={b}>✗ {b}</li>
              ))}
            </ul>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={authorize}
          disabled={busy}
          className="btn-primary disabled:opacity-50"
        >
          {busy ? "Waiting for Freighter…" : "Authorize session"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
            AI Sessions
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Each AI client gets an independent session with its own limits. Session
            keys stay encrypted on the server — never in the browser or AI.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={revokeAll}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Revoke all
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMcpToken(null);
              setStep("form");
            }}
            className="btn-primary"
          >
            New session
          </button>
        </div>
      </div>

      {mcpToken ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
            MCP token — copy now
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Shown once. Paste into Claude/Cursor MCP config — see{" "}
            <code className="text-white/80">docs/MCP_SETUP.md</code>.
          </p>
          <code className="mt-3 block break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs">
            {mcpToken}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className="mt-3 rounded-lg border border-white/20 px-4 py-2 text-sm"
          >
            {copied ? "Copied" : "Copy token"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <p className="text-sm text-white/50">No sessions yet.</p>
      ) : (
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium capitalize">
                  {s.label ?? s.clientType}{" "}
                  <span className="text-xs font-normal text-white/40">
                    ({s.status})
                  </span>
                </p>
                <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-xs text-white/50">
                  {s.sessionPublicKey
                    ? truncateKey(s.sessionPublicKey)
                    : "—"}{" "}
                  · expires{" "}
                  {s.expiresAt
                    ? new Date(s.expiresAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              {s.active ? (
                <button
                  type="button"
                  onClick={() => revoke(s.id)}
                  className="text-sm text-white/50 underline hover:text-white"
                >
                  Revoke
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
