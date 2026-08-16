"use client";

import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pay3Logo } from "@/components/ui/Logo";
import { NAV_LINKS } from "@/lib/content";
import { useSiteRevealed } from "./site-revealed";

function ExternalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M3 1h6v6M9 1L4 6M7 4H1v5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavDivider() {
  return (
    <span
      className="mx-1.5 hidden h-6 w-px shrink-0 bg-white/15 lg:block"
      aria-hidden
    />
  );
}

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const revealed = useSiteRevealed();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useGSAP(
    () => {
      if (!revealed) return;

      gsap.from("[data-nav-item]", {
        y: -16,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.05,
        immediateRender: false,
        clearProps: "transform,opacity",
      });
    },
    { scope: headerRef, dependencies: [revealed] }
  );

  useGSAP(
    () => {
      ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        onUpdate: (self) => setScrolled(self.scroll() > 40),
      });
    },
    { scope: headerRef }
  );

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5 md:px-8 md:pt-6"
    >
      <div
        className={`glass-nav flex min-h-14 w-full max-w-6xl items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 sm:gap-3 sm:px-5 sm:py-2.5${scrolled ? " glass-nav--scrolled" : ""}`}
      >
        <Link
          href="/"
          data-nav-item
          className="flex shrink-0 items-center gap-2.5 rounded-full px-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Pay3Logo size={40} priority className="h-10 w-10" />
          <span className="hidden font-[family-name:var(--font-space-grotesk)] text-[17px] font-semibold tracking-tight sm:inline">
            Pay3
          </span>
        </Link>

        <NavDivider />

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Main"
          data-nav-item
        >
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {link.label}
                <ExternalIcon />
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="flex min-h-11 items-center rounded-full px-4 text-[15px] text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <NavDivider />

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Link
            href="/dashboard?connect=freighter"
            data-nav-item
            className="btn-primary relative z-[60] hidden sm:inline-flex"
          >
            Get Started
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <div className="flex flex-col gap-1">
              <span
                className={`block h-0.5 w-4 bg-white transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-4 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-4 bg-white transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          className="glass-sheet absolute left-4 right-4 top-[calc(100%+10px)] mx-auto max-w-6xl overflow-hidden rounded-[28px] p-3 lg:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between rounded-2xl px-4 text-[17px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                  <ExternalIcon />
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-2xl px-4 text-[17px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <Link
              href="/dashboard?connect=freighter"
              className="btn-primary mt-3 w-full text-sm"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
