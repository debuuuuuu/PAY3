"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type SmartAccount = { id: string; contractId: string };
type Policy = { id: string; name: string };
type Session = {
  id: string;
  clientType: string;
  sessionPublicKey: string;
  expiresAt: string;
  policy?: { name: string };
};

type CreateResult = {
  sessionId: string;
  mcpAuthToken: string;
  sessionPublicKey: string;
  expiresAt: string;
  mcpConfig: {
    stdio: { command: string; args: string[]; env: Record<string, string> };
  };
  onChainRegistration: {
    contractId: string;
    sessionPublicKey: string;
    expiresAtUnix: number;
    perTxMax: string;
    dailyMax: string;
    note: string;
  } | null;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [accounts, setAccounts] = useState<SmartAccount[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [smartAccountId, setSmartAccountId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [clientType, setClientType] = useState("CURSOR");
  const [contractId, setContractId] = useState("");
  const [created, setCreated] = useState<CreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [s, a, p] = await Promise.all([
      apiFetch<Session[]>("/api/ai-sessions"),
      apiFetch<SmartAccount[]>("/api/smart-accounts"),
      apiFetch<Policy[]>("/api/policies"),
    ]);
    setSessions(s);
    setAccounts(a);
    setPolicies(p);
    if (!smartAccountId && a[0]) setSmartAccountId(a[0].id);
    if (!policyId && p[0]) setPolicyId(p[0].id);
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function linkAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/smart-accounts", {
        method: "POST",
        body: JSON.stringify({ contractId }),
      });
      setContractId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<CreateResult>("/api/ai-sessions", {
        method: "POST",
        body: JSON.stringify({ smartAccountId, policyId, clientType }),
      });
      setCreated(result);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await apiFetch(`/api/ai-sessions/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">AI sessions</h1>
        <p className="text-pay3-gray-400 text-sm mt-1">
          Link a Soroban vault, create a session, copy MCP config, then register the
          session on-chain with the owner wallet.
        </p>
      </div>

      <form onSubmit={(e) => void linkAccount(e)} className="border border-white/10 rounded-2xl p-5 space-y-3 max-w-xl">
        <h2 className="font-display text-lg">Link smart account</h2>
        <input
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm"
          placeholder="Contract ID (C...)"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Link contract
        </button>
        {accounts.length > 0 ? (
          <ul className="text-xs font-mono text-pay3-gray-400 space-y-1 pt-2">
            {accounts.map((a) => (
              <li key={a.id}>
                {a.contractId.slice(0, 8)}…{a.contractId.slice(-6)}
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={(e) => void createSession(e)} className="border border-white/10 rounded-2xl p-5 space-y-3 max-w-xl">
        <h2 className="font-display text-lg">Create session</h2>
        <label className="block text-sm">
          <span className="text-pay3-gray-400">Smart account</span>
          <select
            className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2"
            value={smartAccountId}
            onChange={(e) => setSmartAccountId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select…
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.contractId.slice(0, 12)}…
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-pay3-gray-400">Policy</span>
          <select
            className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2"
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select…
            </option>
            {policies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-pay3-gray-400">Client</span>
          <select
            className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2"
            value={clientType}
            onChange={(e) => setClientType(e.target.value)}
          >
            <option value="CURSOR">Cursor</option>
            <option value="CLAUDE">Claude</option>
            <option value="CHATGPT">ChatGPT</option>
            <option value="GEMINI">Gemini</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy || !smartAccountId || !policyId}
          className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create AI session"}
        </button>
      </form>

      {created ? (
        <section className="border border-emerald-400/30 rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-lg text-emerald-200">Session created</h2>
          <p className="text-sm text-pay3-gray-400">
            Copy the MCP token into your client env. Then run on-chain{" "}
            <code className="text-white">add_session</code> (see contract README).
          </p>
          <pre className="overflow-x-auto rounded-xl bg-white/5 p-4 text-xs font-mono">
            {JSON.stringify(
              {
                mcpAuthToken: created.mcpAuthToken,
                mcpConfig: created.mcpConfig,
                onChainRegistration: created.onChainRegistration,
              },
              null,
              2,
            )}
          </pre>
          <button
            type="button"
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
            onClick={() =>
              void navigator.clipboard.writeText(created.mcpAuthToken)
            }
          >
            Copy MCP token
          </button>
        </section>
      ) : null}

      {error ? <p className="text-red-300 font-mono text-sm">{error}</p> : null}

      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id} className="border border-white/10 rounded-2xl p-5 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-display">{s.clientType}</p>
              <p className="text-xs font-mono text-pay3-gray-400 mt-1">
                {s.sessionPublicKey}
              </p>
              <p className="text-xs text-pay3-gray-400 mt-1">
                Expires {new Date(s.expiresAt).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revoke(s.id)}
              className="rounded-full border border-red-400/40 text-red-200 px-3 py-1.5 text-sm h-fit"
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
