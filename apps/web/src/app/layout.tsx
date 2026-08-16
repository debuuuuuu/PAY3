import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "Pay3 — AI-Native Finance",
  description:
    "Pay3 is the MCP-powered bridge between AI assistants and crypto payments. XLM and USDC today, more currencies next — session keys, policy engine, autonomous spend.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/pay3-logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Pay3 — Delegate. Validate. Execute.",
    description:
      "MCP-powered AI payments in XLM, USDC, and more. Session keys, policy engine, autonomous spend.",
    images: [{ url: "/pay3-logo.png", width: 512, height: 512, alt: "Pay3" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pay3 — AI-Native Finance",
    description:
      "Give AI assistants financial superpowers — XLM, USDC, and more — inside programmable policies.",
    images: ["/pay3-logo.png"],
    creator: "@PAYThreeWallet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="preload" href="/pay3-logo.png" as="image" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
