"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditLogView } from "@pay3/shared";
import { apiFetch } from "@/lib/api";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiFetch<{ logs: AuditLogView[] }>("/audit");
    setLogs(data.logs);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Audit log
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Read-only record of security-sensitive events (transfers, approvals,
          failures). Newest first.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-white/50">No audit events yet.</p>
      ) : (
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {logs.map((l) => (
            <li key={l.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm">
                  {l.action}
                </p>
                <p className="text-xs text-white/40">
                  {new Date(l.createdAt).toLocaleString()}
                </p>
              </div>
              {l.metadata ? (
                <pre className="mt-2 overflow-x-auto text-xs text-white/45">
                  {JSON.stringify(l.metadata, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
