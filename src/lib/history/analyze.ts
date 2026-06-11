import type { Snapshot } from "./types";

export interface HistorySummary {
  count: number;
  firstTs: number | null;
  lastTs: number | null;
  latest: Snapshot | null;
  previous: Snapshot | null;
  // latest funding APR minus the previous reading's, or null with fewer than two readings.
  fundingAprChange: number | null;
  avgFundingApr: number | null;
  // ── "What changed since the last reading" (the reason to return) ──
  fundingFlipped: boolean; // funding sign changed (the short went from earning to paying or back)
  stanceChanged: boolean; // SoSoValue flow stance changed
  // A one-line summary of what changed, or null when nothing material did.
  changeHeadline: string | null;
}

function buildChangeHeadline(latest: Snapshot, previous: Snapshot): string | null {
  const parts: string[] = [];

  const prevEarns = previous.fundingAprOnNotional >= 0;
  const nowEarns = latest.fundingAprOnNotional >= 0;
  if (prevEarns !== nowEarns) {
    parts.push(`funding flipped to ${nowEarns ? "earning" : "paying"}`);
  }

  if (
    previous.flowStance !== latest.flowStance &&
    latest.flowStance !== "unknown" &&
    previous.flowStance !== "unknown"
  ) {
    parts.push(`institutional flow turned ${latest.flowStance}`);
  }

  // A material funding move on its own (no flip) still counts as news.
  const delta = latest.fundingAprOnNotional - previous.fundingAprOnNotional;
  if (parts.length === 0 && Math.abs(delta) >= 0.02) {
    parts.push(`funding APR ${delta > 0 ? "rose" : "fell"} ${Math.abs(delta * 100).toFixed(1)} points`);
  }

  return parts.length > 0 ? parts.join("; ") : null;
}

// Pure: reduce a snapshot series to the figures the UI shows ("tracked N readings; funding
// changed X since last; what changed"). Deterministic and unit-tested.
export function summarizeHistory(snapshots: Snapshot[]): HistorySummary {
  if (snapshots.length === 0) {
    return {
      count: 0,
      firstTs: null,
      lastTs: null,
      latest: null,
      previous: null,
      fundingAprChange: null,
      avgFundingApr: null,
      fundingFlipped: false,
      stanceChanged: false,
      changeHeadline: null,
    };
  }
  const sorted = [...snapshots].sort((a, b) => a.ts - b.ts);
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const fundingAprChange = previous
    ? latest.fundingAprOnNotional - previous.fundingAprOnNotional
    : null;
  const avgFundingApr = sorted.reduce((acc, s) => acc + s.fundingAprOnNotional, 0) / sorted.length;

  const fundingFlipped = previous
    ? previous.fundingAprOnNotional >= 0 !== latest.fundingAprOnNotional >= 0
    : false;
  const stanceChanged = previous
    ? previous.flowStance !== latest.flowStance &&
      latest.flowStance !== "unknown" &&
      previous.flowStance !== "unknown"
    : false;
  const changeHeadline = previous ? buildChangeHeadline(latest, previous) : null;

  return {
    count: sorted.length,
    firstTs: sorted[0].ts,
    lastTs: latest.ts,
    latest,
    previous,
    fundingAprChange,
    avgFundingApr,
    fundingFlipped,
    stanceChanged,
    changeHeadline,
  };
}
