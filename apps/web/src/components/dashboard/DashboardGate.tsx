"use client";

import { useEffect, useState } from "react";
import { ConnectWallet } from "@/components/dashboard/ConnectWallet";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { fetchCurrentUser, logout } from "@/lib/wallet";

type DashboardGateProps = {
  children: React.ReactNode;
};

function logoutOnClose() {
  // keepalive so the request survives tab close; cookies cleared by Set-Cookie
  void fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

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

  // Logout when the tab/window is closed (or hard-refreshed)
  useEffect(() => {
    if (!publicKey) return;

    const onPageHide = (event: PageTransitionEvent) => {
      // Skip bfcache freeze — user may come back without a full unload
      if (event.persisted) return;
      logoutOnClose();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [publicKey]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* still clear local session UI */
    }
    setPublicKey(null);
  }

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

  return (
    <DashboardShell publicKey={publicKey} onLogout={handleLogout}>
      {children}
    </DashboardShell>
  );
}
