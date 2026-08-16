"use client";

import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useRef, useState } from "react";
import { FEATURE_BEATS } from "@/lib/content";
import { useSiteRevealed } from "./site-revealed";

function CheckMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M6 14.5 11.5 20 22 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BeatVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="glass-sheet space-y-3 rounded-[28px] p-6 md:p-8">
        <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
          <p className="text-[12px] font-medium text-white/40">Cursor</p>
          <p className="mt-1 font-mono text-[13px] text-white/80">{FEATURE_BEATS[0].command}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.08] px-4 py-3">
          <p className="text-[12px] font-medium text-white/40">Pay3 MCP</p>
          <p className="mt-1 text-[15px] text-white/85">wallet.transfer · USDC · policy next</p>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="glass-sheet rounded-[28px] p-6 md:p-8">
        <p className="font-mono text-[12px] text-white/40">{FEATURE_BEATS[1].command}</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-white/40">From</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.04em]">0.01 BTC</p>
          </div>
          <span className="text-white/25">→</span>
          <div className="text-right">
            <p className="text-[13px] text-white/40">To</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.04em]">972 USDC</p>
          </div>
        </div>
        <p className="mt-6 text-[13px] font-medium text-white/45">Quote · policy checks next</p>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-sheet rounded-[24px] p-5">
          <p className="text-[13px] text-white/40">Vault</p>
          <p className="mt-3 text-[22px] font-semibold tracking-[-0.04em]">Sealed</p>
          <p className="mt-1 text-[13px] text-white/40">Freighter</p>
        </div>
        <div className="glass-sheet rounded-[24px] p-5">
          <p className="text-[13px] text-white/40">Jar</p>
          <p className="mt-3 text-[22px] font-semibold tracking-[-0.04em]">12.4 XLM</p>
          <p className="mt-1 text-[13px] text-white/40">Spendable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-sheet flex flex-col items-center rounded-[28px] px-6 py-10 text-center md:px-8 md:py-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#30D158]/15 text-[#30D158]">
        <CheckMark />
      </span>
      <p className="mt-5 font-display text-[2rem] font-bold tracking-[-0.04em]">Settled</p>
      <p className="mt-2 text-[15px] text-white/50">Hurain received 0.5 XLM · 3.2s</p>
      <p className="mt-1 text-[13px] text-white/35">Jar moved. Vault untouched.</p>
    </div>
  );
}

export function CapabilitiesReel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const revealed = useSiteRevealed();
  const beat = FEATURE_BEATS[active];
  const last = active === FEATURE_BEATS.length - 1;

  useGSAP(
    () => {
      if (!revealed) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const wrap = wrapRef.current;
        const pin = pinRef.current;
        if (!wrap || !pin) return;

        const total = FEATURE_BEATS.length;
        const st = ScrollTrigger.create({
          trigger: wrap,
          start: "top top",
          end: () => `+=${(total - 1) * window.innerHeight * 0.85}`,
          pin,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: 0.55,
          onUpdate: (self) => {
            const index = Math.min(
              total - 1,
              Math.max(0, Math.round(self.progress * (total - 1)))
            );
            if (index !== activeRef.current) {
              activeRef.current = index;
              setActive(index);
            }
          },
        });

        requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => st.kill();
      });

      return () => mm.revert();
    },
    { scope: wrapRef, dependencies: [revealed] }
  );

  useGSAP(
    () => {
      if (!revealed) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap
        .timeline()
        .fromTo(
          copyRef.current,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }
        )
        .fromTo(
          visualRef.current,
          { autoAlpha: 0, scale: 0.94, filter: "blur(14px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" },
          "-=0.28"
        );
    },
    { scope: pinRef, dependencies: [active, revealed], revertOnUpdate: true }
  );

  return (
    <div ref={wrapRef} id="features" className="section-dark">
      <div
        className="section-glow pointer-events-none absolute left-[18%] top-16 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.12),transparent)] blur-3xl"
        aria-hidden
      />

      <div className="space-y-10 px-6 py-20 md:hidden">
        {FEATURE_BEATS.map((item, i) => (
          <article key={item.title}>
            <p className="text-[13px] font-medium text-white/45">{item.kicker}</p>
            <h2 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.04em] leading-[1.1]">
              {item.title}
            </h2>
            <p className="mt-3 text-[16px] leading-[1.47] text-white/50">{item.body}</p>
            <div className="mt-6">
              <BeatVisual index={i} />
            </div>
          </article>
        ))}
      </div>

      <div
        ref={pinRef}
        className="hidden min-h-[100dvh] flex-col justify-center py-16 md:flex md:py-20"
      >
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-12 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-[13px] font-medium text-white/45">How it works</p>
            <div ref={copyRef} className="min-h-[220px]">
              <p className="mt-5 text-[15px] font-medium text-white/40">{beat.kicker}</p>
              <h2 className="mt-2 max-w-xl font-display text-[clamp(2.4rem,4.5vw,3.6rem)] font-bold tracking-[-0.045em] leading-[1.05]">
                {beat.title}
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-[1.47] text-white/50">{beat.body}</p>
            </div>
            <div className="mt-8 flex gap-2" aria-hidden>
              {FEATURE_BEATS.map((item, i) => (
                <span
                  key={item.kicker}
                  className="h-1 rounded-full transition-[width,background-color] duration-300"
                  style={{
                    width: i === active ? 36 : 10,
                    backgroundColor:
                      i === active
                        ? last
                          ? "rgb(48, 209, 88)"
                          : "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.18)",
                  }}
                />
              ))}
            </div>
          </div>
          <div ref={visualRef} className="will-change-transform">
            <BeatVisual index={active} />
          </div>
        </div>
      </div>
    </div>
  );
}
