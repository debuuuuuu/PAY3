"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DASHBOARD_NAV } from "@pay3/shared";
import { truncateKey } from "@/lib/wallet";
import { DashboardReveal } from "./DashboardReveal";

type DashboardShellProps = {
  publicKey?: string;
  onLogout?: () => void;
  children: React.ReactNode;
};

const PRIMARY = new Set([
  "/dashboard",
  "/dashboard/contacts",
  "/dashboard/sessions",
  "/dashboard/approvals",
  "/dashboard/history",
]);

export function DashboardShell({
  publicKey,
  onLogout,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const primary = DASHBOARD_NAV.filter((item) => PRIMARY.has(item.href));
  const secondary = DASHBOARD_NAV.filter((item) => !PRIMARY.has(item.href));
  const moreActive = secondary.some((item) =>
    item.href === "/guide"
      ? pathname.startsWith("/guide")
      : pathname.startsWith(item.href)
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onDoc(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/guide") return pathname.startsWith("/guide");
    return pathname.startsWith(href);
  }

  return (
    <div className="dash-shell relative min-h-screen overflow-x-hidden bg-[#070708] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_50%_-10%,rgba(255,255,255,0.07),transparent_55%)]"
        aria-hidden
      />

      <header className="dash-header sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
        <div className="dash-header-bar mx-auto flex max-w-6xl flex-col gap-2.5 rounded-2xl border border-white/[0.09] bg-[#0c0c0e]/78 px-3 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:flex-row md:items-center md:gap-3 md:px-3 md:py-2">
          <div className="flex items-center justify-between gap-3 md:contents">
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2.5 rounded-xl px-1 py-0.5 transition-opacity duration-300 hover:opacity-90"
            >
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[11px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <Image
                  src="/pay3-logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  priority
                />
              </span>
              <span className="hidden sm:block">
                <span className="block font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold leading-none tracking-tight">
                  Pay3
                </span>
                <span className="mt-1 block font-[family-name:var(--font-jetbrains-mono)] text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Dashboard
                </span>
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-2 md:order-3">
              <a
                href="https://pay3.mintlify.site"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/55 transition-[color,background,border-color] duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
              >
                Docs
              </a>
              {publicKey ? (
                <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] py-1 pl-1.5 pr-2.5 sm:pr-3">
                  <span
                    className="relative flex h-2 w-2"
                    title="Connected"
                    aria-hidden
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-white/70">
                    {truncateKey(publicKey)}
                  </span>
                </div>
              ) : null}
              {publicKey && onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/55 transition-[color,background,border-color,transform] duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:scale-[0.97]"
                >
                  Log out
                </button>
              ) : null}
            </div>
          </div>

          <nav
            className="dash-nav-track hidden min-w-0 flex-1 justify-center lg:flex md:order-2"
            aria-label="Dashboard"
          >
            <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-black/35 p-1 ring-1 ring-white/[0.06] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {primary.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-[color,background,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      active
                        ? "bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                        : "text-white/45 hover:bg-white/[0.06] hover:text-white/90"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-[color,background] duration-300 ${
                    moreActive || moreOpen
                      ? "bg-white/12 text-white"
                      : "text-white/45 hover:bg-white/[0.06] hover:text-white/90"
                  }`}
                >
                  More
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    aria-hidden
                    className={`opacity-50 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M2 3.5 L5 6.5 L8 3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {moreOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/96 p-1 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl"
                  >
                    {secondary.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className={`block rounded-xl px-3.5 py-2.5 text-[13px] transition-colors ${
                            active
                              ? "bg-white/10 text-white"
                              : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                    <a
                      href="https://pay3.mintlify.site"
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      className="mt-0.5 block rounded-xl border-t border-white/[0.06] px-3.5 py-2.5 text-[13px] text-white/55 hover:bg-white/[0.06] hover:text-white"
                    >
                      Docs ↗
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </nav>

          <nav
            className="flex gap-1 overflow-x-auto pb-0.5 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Dashboard mobile"
          >
            {DASHBOARD_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "text-white/40 ring-1 ring-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-6 md:py-8">
        <DashboardReveal>{children}</DashboardReveal>
      </main>
    </div>
  );
}
