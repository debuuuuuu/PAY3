"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "@pay3/shared";
import { truncateKey } from "@/lib/wallet";

type DashboardShellProps = {
  publicKey?: string;
  onLogout?: () => void;
  children: React.ReactNode;
};

export function DashboardShell({
  publicKey,
  onLogout,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold"
            >
              Pay3
            </Link>
            <nav className="hidden gap-1 md:flex" aria-label="Dashboard">
              {DASHBOARD_NAV.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          {publicKey ? (
            <div className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-white/60">
                {truncateKey(publicKey)}
              </span>
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Log out
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
