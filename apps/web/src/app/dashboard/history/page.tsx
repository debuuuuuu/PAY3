"use client";

import { useEffect, useState } from "react";
import type { HorizonPaymentView, TransactionView } from "@pay3/shared";
import { apiFetch } from "@/lib/api";
import { truncateKey } from "@/lib/wallet";

export default function HistoryPage() {
  const [payments, setPayments] = useState<HorizonPaymentView[]>([]);
  const [transactions, setTransactions] = useState<TransactionView[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ payments: HorizonPaymentView[]; message?: string }>("/history"),
      apiFetch<{ transactions: TransactionView[] }>("/transactions"),
    ])
      .then(([h, t]) => {
        setPayments(h.payments);
        setMessage(h.message ?? null);
        setTransactions(t.transactions);
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Transaction history
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Pay3 lifecycle records plus on-chain Horizon payments for your
          allocation account.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : (
        <>
          <div>
            <h2 className="mb-3 text-xs uppercase tracking-wide text-white/40">
              Pay3 transfers
            </h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-white/50">No Pay3 transfers yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                    <tr>
                      <th className="px-4 py-3 font-medium">When</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Policy</th>
                      <th className="px-4 py-3 font-medium">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-white/5">
                        <td className="px-4 py-3 text-white/60">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-[family-name:var(--font-jetbrains-mono)] text-xs">
                          {t.status}
                        </td>
                        <td className="px-4 py-3 font-[family-name:var(--font-jetbrains-mono)]">
                          {t.amount} {t.asset}
                        </td>
                        <td className="px-4 py-3 text-xs text-white/50">
                          {t.policyDecision ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {t.stellarTransactionHash ? (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${t.stellarTransactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-[family-name:var(--font-jetbrains-mono)] text-xs underline"
                            >
                              {truncateKey(t.stellarTransactionHash)}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-wide text-white/40">
              Horizon (allocation account)
            </h2>
            {message && payments.length === 0 ? (
              <p className="text-sm text-white/50">{message}</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-white/50">No Horizon payments yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-white/60">
                {payments.slice(0, 15).map((p) => (
                  <li key={p.id} className="font-[family-name:var(--font-jetbrains-mono)] text-xs">
                    {p.amount} {p.asset} · {p.type} ·{" "}
                    {new Date(p.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
