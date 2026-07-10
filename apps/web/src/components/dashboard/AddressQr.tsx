"use client";

import { useEffect, useState } from "react";

type AddressQrProps = {
  publicKey: string;
};

/** QR encodes the raw G-address — what most Stellar wallets expect when scanning. */
export function AddressQr({ publicKey }: AddressQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("qrcode")
      .then((QR) =>
        QR.toDataURL(publicKey, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        })
      )
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!dataUrl) {
    return (
      <div
        className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-white/10 text-xs text-white/40"
        aria-hidden
      >
        QR…
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code for Stellar address ${publicKey}`}
      width={200}
      height={200}
      className="rounded-lg bg-white p-2"
    />
  );
}
