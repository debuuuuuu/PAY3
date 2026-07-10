"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Tx = {
  id: string;
  action: string;
  asset: string;
  amount: string | null;
  recipientInput: string | null;
  status: string;
  stellarTransactionHash: string | null;
  createdAt: string;
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Tx[]>("/api/transactions")
      .then(setRows)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load."),
      );
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Transactions</h1>
        <p className="text-pay3-gray-400 text-sm mt-1">Recent Pay3 payment lifecycle events.</p>
      </div>

      {error ? <p className="text-red-300 font-mono text-sm">{error}</p> : null}

      {rows.length === 0 ? (
        <p className="text-pay3-gray-400 text-sm">No transactions yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((tx) => (
            <li key={tx.id} className="border border-white/10 rounded-2xl p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-display">
                  {tx.amount ?? "—"} {tx.asset} · {tx.status}
                </p>
                <p className="text-xs font-mono text-pay3-gray-400">
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-pay3-gray-400 mt-1">
                {tx.action} → {tx.recipientInput ?? "—"}
              </p>
              {tx.stellarTransactionHash ? (
                <p className="text-xs font-mono text-pay3-gray-400 mt-2 break-all">
                  {tx.stellarTransactionHash}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
