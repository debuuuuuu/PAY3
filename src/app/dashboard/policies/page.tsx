"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Policy = {
  id: string;
  name: string;
  preset: string;
  dailyBudget: string;
  perTransactionMax: string;
  manualApprovalThreshold: string;
  sessionDurationHours: number;
  allowedAssets: string[];
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [name, setName] = useState("Balanced default");
  const [preset, setPreset] = useState("BALANCED");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const rows = await apiFetch<Policy[]>("/api/policies");
    setPolicies(rows);
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load policies."),
    );
  }, []);

  async function createPolicy(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/policies", {
        method: "POST",
        body: JSON.stringify({ name, preset }),
      });
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Policies</h1>
        <p className="text-pay3-gray-400 text-sm mt-1">
          Spending limits and approval thresholds for AI sessions.
        </p>
      </div>

      <form onSubmit={(e) => void createPolicy(e)} className="border border-white/10 rounded-2xl p-5 space-y-4 max-w-lg">
        <label className="block text-sm">
          <span className="text-pay3-gray-400">Name</span>
          <input
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-pay3-gray-400">Preset</span>
          <select
            className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="CONSERVATIVE">Conservative</option>
            <option value="BALANCED">Balanced</option>
            <option value="DEFI">DeFi</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create policy"}
        </button>
      </form>

      {error ? <p className="text-red-300 font-mono text-sm">{error}</p> : null}

      <ul className="space-y-3">
        {policies.map((p) => (
          <li key={p.id} className="border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-display text-lg">{p.name}</p>
                <p className="text-xs text-pay3-gray-400 font-mono mt-1">{p.preset}</p>
              </div>
              <p className="text-xs font-mono text-pay3-gray-400 truncate max-w-[40%]">{p.id}</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
              <div>
                <dt className="text-pay3-gray-400 text-xs">Daily</dt>
                <dd>{String(p.dailyBudget)}</dd>
              </div>
              <div>
                <dt className="text-pay3-gray-400 text-xs">Per tx</dt>
                <dd>{String(p.perTransactionMax)}</dd>
              </div>
              <div>
                <dt className="text-pay3-gray-400 text-xs">Approval above</dt>
                <dd>{String(p.manualApprovalThreshold)}</dd>
              </div>
              <div>
                <dt className="text-pay3-gray-400 text-xs">Session hrs</dt>
                <dd>{p.sessionDurationHours}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
