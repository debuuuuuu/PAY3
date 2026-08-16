"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useRef } from "react";
import { HOW_IT_WORKS } from "@/lib/content";
import { FeaturePanel, type PanelScreen } from "./FeaturePanel";

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-how-title]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.utils.toArray<HTMLElement>("[data-how-card]").forEach((card, i) => {
        gsap.from(card, {
          y: reduced ? 0 : 40,
          scale: reduced ? 1 : 0.96,
          opacity: 0,
          duration: reduced ? 0.2 : 0.75,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 85%" },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="section-light relative overflow-hidden py-28 md:py-36"
    >
      <div
        className="section-glow pointer-events-none absolute left-1/2 top-10 h-72 w-[min(42rem,90vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),rgba(210,216,230,0.35)_55%,transparent)] blur-2xl"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <h2
          data-how-title
          className="text-center font-display text-[clamp(2.25rem,5vw,3.5rem)] font-bold tracking-[-0.04em] text-black"
        >
          Connect Pay3 in three steps
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center text-[17px] leading-[1.47] text-black/45">
          Fund a jar. Set limits. Let the agent pay — in the currency you allow.
        </p>

        <div className="mt-14 grid items-stretch gap-4 md:grid-cols-3 md:gap-5">
          {HOW_IT_WORKS.map((item) => (
            <article
              key={item.step}
              data-how-card
              className="flex flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_12px_40px_rgba(0,0,0,0.06)]"
            >
              <div className="px-7 pt-7 md:px-8 md:pt-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[13px] font-semibold text-white">
                    {item.step}
                  </span>
                  <span className="text-[13px] font-medium text-black/40">{item.kicker}</span>
                </div>
                <h3 className="mt-5 font-display text-[1.65rem] font-bold leading-[1.15] tracking-[-0.03em] text-black">
                  {item.title}
                </h3>
                <p className="mt-2.5 min-h-[4.5rem] text-[15px] leading-[1.45] text-black/50">
                  {item.description}
                </p>
              </div>

              <div className="mt-auto px-4 pb-4 pt-2 md:px-5 md:pb-5">
                <FeaturePanel screen={item.screen as PanelScreen} nested />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
