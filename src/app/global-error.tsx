"use client";

// Top-level error boundary. Replaces Next's built-in _global-error page (which fails to
// prerender under this Next 16 + Turbopack build) and gives a branded, reassuring fallback.
// A global-error component must render its own <html>/<body>.

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-foreground">
        <p className="text-micro uppercase tracking-wide text-down">Application error</p>
        <h1 className="text-stat font-semibold">BasisDesk failed to load</h1>
        <p className="max-w-md text-center text-body text-muted">
          An unexpected error stopped the app from rendering. Your funds are unaffected: BasisDesk
          is non-custodial and never holds your keys.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-body font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
