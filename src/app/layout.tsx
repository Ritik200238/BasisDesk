import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { Providers } from "@/components/wallet/Providers";

// Schibsted Grotesk carries all text and headings — a variable font, so the full
// 400–900 weight range is available for the dense editorial hierarchy.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

// IBM Plex Mono carries every number in the UI: tabular figures, slashed zero. It is not a
// variable font on Google Fonts, so explicit weights are required.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BasisDesk — delta-neutral on-chain yield",
  description:
    "Hold the asset, short the perp, harvest the funding rate. A delta-neutral vault that stays market-neutral while earning SoDEX funding, driven by SoSoValue flow and news data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
