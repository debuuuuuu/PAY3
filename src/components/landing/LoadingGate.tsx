"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { extractLogoPixels } from "@/lib/pixel-logo";
import { ScrollTrigger } from "@/lib/gsap";
import { PixelLoader } from "./PixelLoader";
import { SiteRevealedCtx } from "./site-revealed";

function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/dashboard") || pathname.startsWith("/login");
}

export function LoadingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipLoader = isAppRoute(pathname);
  const [ready, setReady] = useState(skipLoader);
  const [revealed, setRevealed] = useState(skipLoader);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    document.body.style.overflow = "";
    setReady(true);
  };

  useEffect(() => {
    if (skipLoader) {
      document.body.style.overflow = "";
      setReady(true);
      setRevealed(true);
      return;
    }

    void extractLogoPixels("/pay3-logo.png");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      setRevealed(true);
      return;
    }

    document.body.style.overflow = "hidden";
    const fallback = window.setTimeout(() => {
      setRevealed(true);
      finish();
    }, 3200);

    return () => {
      window.clearTimeout(fallback);
      document.body.style.overflow = "";
    };
  }, [skipLoader]);

  useEffect(() => {
    if (!revealed) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  return (
    <SiteRevealedCtx.Provider value={revealed}>
      {!ready && !skipLoader && (
        <PixelLoader
          onReveal={() => setRevealed(true)}
          onDone={finish}
        />
      )}
      <div
        className="transition-opacity duration-500 ease-out"
        style={{
          opacity: revealed || skipLoader ? 1 : 0,
          pointerEvents: revealed || skipLoader ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </SiteRevealedCtx.Provider>
  );
}
