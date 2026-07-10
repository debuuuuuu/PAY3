"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function FreighterQr({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(url, {
      width: 220,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((value) => {
      if (!cancelled) setDataUrl(value);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUrl) {
    return (
      <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-white/10" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code to open Pay3 login in Freighter Mobile"
      width={220}
      height={220}
      className="rounded-xl bg-white p-2"
    />
  );
}
