"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useRef } from "react";
import { Pay3Logo } from "@/components/ui/Logo";
import { NAV_LINKS } from "@/lib/content";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.2 5.4 10l6.5-6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  "Keys stay in Freighter — never in Pay3",
  "AI spends only from the funded jar",
  "Pay in XLM, USDC, and more currencies as we add them",
  "Daily and per-tx caps on every session",
  "Pay contacts by name — never guess an address",
  "Only approved actions go on-chain",
  "Revoke a session in one tap",
] as const;

export function SecuritySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-security-item]", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="section-dark py-24 md:py-28">
      <div
        className="section-glow pointer-events-none absolute right-[8%] top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),transparent)] blur-3xl md:h-[28rem] md:w-[28rem]"
        aria-hidden
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:px-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/35">
            Security first
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-bold tracking-[-0.04em] leading-[1.05]">
            The AI proposes.
            <br />
            Your policy decides.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-[1.47] text-white/55">
            Every spend hits policy before it hits the chain. Sessions expire.
            Ambiguous names wait for you. Revoke in one tap. XLM and USDC now;
            more currencies on the same rails.
          </p>
        </div>

        <ul className="glass-sheet overflow-hidden rounded-[28px]">
          {FEATURES.map((text, i) => (
            <li
              key={text}
              data-security-item
              className={`flex min-h-14 items-center gap-3.5 px-5 py-3.5 ${
                i < FEATURES.length - 1 ? "border-b border-white/8" : ""
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#30D158]/15 text-[#30D158]">
                <CheckIcon />
              </span>
              <span className="text-[17px] leading-snug text-white/85">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-black py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:items-start">
            <Pay3Logo size={40} className="h-10 w-10 opacity-90" />
            <p className="mt-4 max-w-xs text-center text-sm text-white/40 md:text-left">
              MCP-powered AI payments. XLM and USDC on testnet; more currencies next.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a href="/guide/getting-started" className="btn-primary shrink-0 text-sm">
            Getting started
          </a>
        </div>

        <p className="mt-12 text-center text-xs text-white/25 md:text-left">
          © {year} Pay3. XLM · USDC · more currencies coming · MCP.
        </p>
      </div>
    </footer>
  );
}
