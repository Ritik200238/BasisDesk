import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BasisDesk — Brand Kit",
  description: "Logo, palette, typography, and usage guidelines for BasisDesk.",
};

// The brand kit is the designer's self-contained document, served from /brandkit.html and
// framed here so it lives inside the product nav. Kept in an isolated iframe so its own
// styles never leak into (or inherit from) the app shell.
export default function BrandKitPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-micro font-semibold uppercase tracking-wide text-accent">
          Brand
        </span>
        <h1 className="text-stat font-bold tracking-tight text-foreground">Brand kit</h1>
        <p className="max-w-2xl text-body text-muted">
          The BasisDesk mark, palette, typography, and usage rules. Open{" "}
          <a
            href="/brandkit.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            in a full tab
          </a>
          .
        </p>
      </div>
      <iframe
        src="/brandkit.html"
        title="BasisDesk brand kit"
        className="h-[80vh] w-full rounded-lg border border-border bg-surface"
      />
    </div>
  );
}
