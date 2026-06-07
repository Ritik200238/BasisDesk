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
}

// Pure: reduce a snapshot series to the figures the UI shows ("tracked N readings; funding
// changed X since last"). Deterministic and unit-tested.
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
    };
  }
  const sorted = [...snapshots].sort((a, b) => a.ts - b.ts);
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const fundingAprChange = previous
    ? latest.fundingAprOnNotional - previous.fundingAprOnNotional
    : null;
  const avgFundingApr =
    sorted.reduce((acc, s) => acc + s.fundingAprOnNotional, 0) / sorted.length;
  return {
    count: sorted.length,
    firstTs: sorted[0].ts,
    lastTs: latest.ts,
    latest,
    previous,
    fundingAprChange,
    avgFundingApr,
  };
}
