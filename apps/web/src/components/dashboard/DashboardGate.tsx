"use client";

import { useEffect, useState } from "react";
import { ConnectWallet } from "@/components/dashboard/ConnectWallet";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { fetchCurrentUser } from "@/lib/wallet";

type DashboardGateProps = {
  children: React.ReactNode;
};

export function DashboardGate({ children }: DashboardGateProps) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setPublicKey(user?.publicKey ?? null);
      })
      .catch(() => {
        if (!cancelled) setPublicKey(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <DashboardShell>
        <p className="text-center text-sm text-white/50">Loading…</p>
      </DashboardShell>
    );
  }

  if (!publicKey) {
    return (
      <DashboardShell>
        <ConnectWallet onConnected={setPublicKey} />
      </DashboardShell>
    );
  }

  return <DashboardShell publicKey={publicKey}>{children}</DashboardShell>;
}
