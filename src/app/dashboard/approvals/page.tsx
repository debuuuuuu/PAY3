"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Approval = {
  id: string;
  transactionId: string;
  expiresAt: string;
  transaction: {
    amount: string;
    asset: string;
    recipientInput: string | null;
    status: string;
  };
  aiSession: { clientType: string };
};

export default function ApprovalsPage() {
  const [rows, setRows] = useState<Approval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const data = await apiFetch<Approval[]>("/api/approvals/pending");
    setRows(data);
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load."),
    );
  }, []);

  async function approve(transactionId: string) {
    setBusyId(transactionId);
    setError(null);
    try {
      await apiFetch(`/api/approvals/${transactionId}/approve`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Approvals</h1>
        <p className="text-pay3-gray-400 text-sm mt-1">
          Pending transfers expire after 2 minutes if not approved.
        </p>
      </div>

      {error ? <p className="text-red-300 font-mono text-sm">{error}</p> : null}

      {rows.length === 0 ? (
        <p className="text-pay3-gray-400 text-sm">No pending approvals.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="border border-white/10 rounded-2xl p-5 flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-display text-lg">
                  {String(row.transaction.amount)} {row.transaction.asset}
                </p>
                <p className="text-sm text-pay3-gray-400 mt-1">
                  To {row.transaction.recipientInput ?? "—"} · {row.aiSession.clientType}
                </p>
                <p className="text-xs font-mono text-pay3-gray-400 mt-2">
                  Expires {new Date(row.expiresAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === row.transactionId}
                onClick={() => void approve(row.transactionId)}
                className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium h-fit disabled:opacity-50"
              >
                {busyId === row.transactionId ? "Approving…" : "Approve"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
