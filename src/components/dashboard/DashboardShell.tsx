"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Pay3Logo } from "@/components/ui/Logo";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/policies", label: "Policies" },
  { href: "/dashboard/sessions", label: "Sessions" },
  { href: "/dashboard/approvals", label: "Approvals" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/transactions", label: "Transactions" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiFetch<{ walletAddress: string }>("/api/auth/me");
        if (!cancelled) {
          setWallet(me.walletAddress);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            router.replace("/login");
            return;
          }
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pay3-black text-pay3-white flex items-center justify-center font-mono text-sm text-pay3-gray-400">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pay3-black text-pay3-white">
      <header className="border-b border-white/10 sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Pay3Logo className="h-7 w-auto" />
            <span className="font-display text-sm tracking-wide text-pay3-gray-400">
              Dashboard
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-mono text-pay3-gray-400">
            {wallet ? (
              <span title={wallet}>
                {wallet.slice(0, 4)}…{wallet.slice(-4)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-white/15 px-3 py-1.5 text-pay3-white hover:bg-white/5"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 pb-3 flex gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-white text-black"
                    : "text-pay3-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
