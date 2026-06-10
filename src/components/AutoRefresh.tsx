"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Periodically re-runs the route's server components (router.refresh) so live funding, prices,
// and flow data update without a manual reload — while preserving client state (wallet, forms).
// Pauses while the tab is hidden and refreshes once on becoming visible again, to avoid burning
// the shared API budget on background tabs.
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  return null;
}
