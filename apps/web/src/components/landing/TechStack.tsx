"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useRef } from "react";
import { TECH_GROUPS } from "@/lib/content";

export function TechStack() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.from("[data-tech-title]", {
        y: reduced ? 0 : 28,
        opacity: 0,
        duration: reduced ? 0.2 : 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
      gsap.from("[data-tech-tile]", {
        y: reduced ? 0 : 24,
        scale: reduced ? 1 : 0.97,
        opacity: 0,
        duration: reduced ? 0.2 : 0.55,
        stagger: reduced ? 0 : 0.05,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-tech-grid]", start: "top 85%" },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="section-light py-24 md:py-32">
      <div
        className="section-glow pointer-events-none absolute left-1/2 top-8 h-56 w-[min(36rem,80vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),transparent)] blur-2xl"
        aria-hidden
      />

      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <h2
          data-tech-title
          className="text-center font-display text-[clamp(2.25rem,5vw,3.5rem)] font-bold tracking-[-0.04em] text-black"
        >
          Technology stack
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center text-[17px] leading-[1.47] text-black/45">
          The rails the agent uses. Not the kitchen sink.
        </p>

        <div data-tech-grid className="mt-14 grid gap-3 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <article
              key={group.kicker}
              data-tech-tile
              className="rounded-[28px] bg-white px-6 py-6 shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_12px_40px_rgba(0,0,0,0.06)]"
            >
              <p className="text-[13px] font-medium text-black/40">{group.kicker}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[15px] font-medium tracking-[-0.02em] text-black/80"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
