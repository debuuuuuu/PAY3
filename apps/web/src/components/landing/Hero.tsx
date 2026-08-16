"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Image from "next/image";
import { useRef } from "react";
import { FeaturePanel } from "./FeaturePanel";
import { CommandTicker } from "./CommandTicker";
import { PixelField } from "./PixelField";
import { PixelLogo } from "./PixelLogo";
import { useSiteRevealed } from "./site-revealed";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealed = useSiteRevealed();

  useGSAP(
    () => {
      if (!revealed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ease = "power3.out";
      const tl = gsap.timeline({
        defaults: { ease, duration: reduced ? 0.2 : 0.7 },
        delay: 0.05,
      });

      tl.from("[data-hero-eyebrow]", { y: reduced ? 0 : 16, opacity: 0, immediateRender: false })
        .from(
          "[data-hero-line]",
          {
            y: reduced ? 0 : 56,
            opacity: 0,
            duration: reduced ? 0.2 : 0.9,
            stagger: reduced ? 0 : 0.08,
            immediateRender: false,
          },
          "-=0.35"
        )
        .from("[data-hero-body]", { y: reduced ? 0 : 20, opacity: 0, immediateRender: false }, "-=0.45")
        .from("[data-hero-cta]", { y: reduced ? 0 : 12, opacity: 0, immediateRender: false }, "-=0.35");

      if (reduced) {
        gsap.from("[data-hero-visual]", { opacity: 0, duration: 0.2, immediateRender: false });
      } else {
        gsap.from("[data-hero-visual]", {
          y: 28,
          scale: 0.92,
          opacity: 0,
          filter: "blur(18px)",
          duration: 0.95,
          ease: "power3.out",
          immediateRender: false,
          delay: 0.25,
        });
      }

      if (!reduced) {
        gsap.to("[data-hero-watermark]", {
          x: -60,
          duration: 30,
          repeat: -1,
          ease: "none",
        });
      }
    },
    { scope: sectionRef, dependencies: [revealed] }
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-black"
    >
      <PixelField />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(255,255,255,0.12),transparent_50%)]"
        aria-hidden
      />

      <div
        data-hero-watermark
        className="pointer-events-none absolute -bottom-12 left-0 flex gap-16 opacity-[0.04]"
        aria-hidden
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Image
            key={i}
            src="/pay3-logo.png"
            alt=""
            width={256}
            height={256}
            className="h-48 w-48 object-contain md:h-64 md:w-64"
          />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-20 pt-32 md:grid-cols-2 md:gap-16 md:px-12 md:pb-28 md:pt-36">
        <div className="z-10 max-w-2xl">
          <p
            data-hero-eyebrow
            className="mb-6 flex flex-wrap items-center gap-2.5 text-[13px] font-medium tracking-[-0.01em] text-white/50"
          >
            <span>AI-native finance · any currency</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium tracking-normal text-white/90 backdrop-blur-md">
              Testnet
            </span>
          </p>

          <h1 className="font-display text-[clamp(3.25rem,10vw,5.75rem)] font-bold leading-[0.95] tracking-[-0.045em]">
            <span data-hero-line className="block">
              Delegate.
            </span>
            <span data-hero-line className="block">
              Validate.
            </span>
            <span data-hero-line className="block">
              Execute.
            </span>
          </h1>

          <p
            data-hero-body
            className="mt-7 max-w-md text-[17px] leading-[1.47] text-white/60 md:mt-8 md:text-[19px]"
          >
            Pay3 lets AI spend from a funded jar — not your Freighter vault.
            Policies decide auto, ask, or reject. XLM and USDC now; more currencies next.
          </p>

          <div data-hero-cta className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/dashboard?connect=freighter" className="btn-primary">
              Get Started
            </a>
            <a href="#how-it-works" className="btn-ghost">
              How it works
            </a>
          </div>

          <CommandTicker />
        </div>

        <div data-hero-visual className="relative z-10 w-full will-change-transform md:max-w-lg md:justify-self-end">
          <div className="glass-sheet mx-auto w-full max-w-sm rounded-[32px] p-5 sm:max-w-md md:max-w-none md:p-6">
            <div className="flex h-48 w-full items-center justify-center py-3 md:h-56">
              <PixelLogo pixelSize={8} interactive idle compact skipEntrance />
            </div>

            <div className="mt-3 border-t border-white/10 pt-4">
              <FeaturePanel screen="flow" embedded className="max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
