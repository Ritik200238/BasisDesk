// Flow regime: turn a SoSoValue daily ETF-flow series into a stateful signal the vault acts on.
// This is the load-bearing link — institutional flows tell the vault when to de-risk and how much
// to size. A composite of multiple factors (direction, streak, magnitude, recent trend) yields a
// conviction and a position-size multiplier. Pure and deterministic; the LLM never computes this.

import type { RiskState } from "@/lib/core";
import type { EtfSummaryRecord } from "@/lib/sosovalue";

export type FlowDirection = "inflow" | "outflow" | "flat";
export type FlowStance = "supportive" | "neutral" | "caution";
export type FlowConviction = "low" | "medium" | "high";

export interface FlowRegime {
  symbol: string;
  latestDate: string;
  latestNetInflowUsd: number;
  direction: FlowDirection;
  // Consecutive days (including the latest) in the same direction.
  streakDays: number;
  // True when the latest day flipped direction versus the prior day.
  flippedToday: boolean;
  cumNetInflowUsd: number | null;
  aumUsd: number | null;
  stance: FlowStance;
  headline: string;

  // ── Composite "brain" factors (each normalized to [-1, 1]; negative = outflow/caution) ──
  // Latest day relative to the recent typical daily flow.
  magnitudeScore: number;
  // Streak length and direction.
  streakScore: number;
  // Net direction and momentum of the recent window.
  trendScore: number;
  // Weighted blend of the above; the single conviction number.
  compositeScore: number;
  // How strongly to trust the composite (size of |composite| plus data sufficiency).
  conviction: FlowConviction;
  // Suggested position-size factor in [0.5, 1]: outflow conviction shrinks the size SoSoValue
  // would have the vault take. This is where flows drive sizing, not just a badge.
  sizeMultiplier: number;
}

function direction(x: number): FlowDirection {
  if (x > 0) return "inflow";
  if (x < 0) return "outflow";
  return "flat";
}

function dirSign(d: FlowDirection): number {
  return d === "inflow" ? 1 : d === "outflow" ? -1 : 0;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export function computeFlowRegime(symbol: string, records: EtfSummaryRecord[]): FlowRegime | null {
  if (records.length === 0) return null;
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const latestDir = direction(latest.total_net_inflow);

  let streakDays = 0;
  if (latestDir !== "flat") {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (direction(sorted[i].total_net_inflow) === latestDir) streakDays++;
      else break;
    }
  }

  const prevDir = sorted.length >= 2 ? direction(sorted[sorted.length - 2].total_net_inflow) : "flat";
  const flippedToday =
    streakDays === 1 && latestDir !== "flat" && prevDir !== "flat" && prevDir !== latestDir;

  const stance: FlowStance =
    latestDir === "outflow" ? "caution" : latestDir === "inflow" ? "supportive" : "neutral";

  const headline =
    latestDir === "flat"
      ? "Flat flows"
      : `Day ${streakDays} ${latestDir} streak${flippedToday ? " (flipped today)" : ""}`;

  // ── Composite factors over the recent window ──
  const window = sorted.slice(-Math.min(7, sorted.length));
  const flows = window.map((r) => r.total_net_inflow);
  const avgAbsFlow = flows.reduce((s, f) => s + Math.abs(f), 0) / Math.max(flows.length, 1);

  const magnitudeScore = avgAbsFlow > 0 ? clamp(latest.total_net_inflow / (3 * avgAbsFlow), -1, 1) : 0;
  const streakScore = dirSign(latestDir) * Math.min(streakDays / 5, 1);
  const windowSum = flows.reduce((s, f) => s + f, 0);
  const trendScore = avgAbsFlow > 0 ? clamp(windowSum / (flows.length * 2 * avgAbsFlow), -1, 1) : 0;

  const compositeScore = clamp(0.4 * streakScore + 0.35 * trendScore + 0.25 * magnitudeScore, -1, 1);

  const mag = Math.abs(compositeScore);
  const conviction: FlowConviction =
    mag >= 0.5 && sorted.length >= 5 ? "high" : mag >= 0.2 ? "medium" : "low";

  // Outflow conviction shrinks the suggested size toward a 0.5 floor; inflows keep full size.
  const sizeMultiplier = compositeScore >= 0 ? 1 : clamp(1 + 0.5 * compositeScore, 0.5, 1);

  return {
    symbol,
    latestDate: latest.date,
    latestNetInflowUsd: latest.total_net_inflow,
    direction: latestDir,
    streakDays,
    flippedToday,
    cumNetInflowUsd: latest.cum_net_inflow ?? null,
    aumUsd: latest.total_net_assets ?? null,
    stance,
    headline,
    magnitudeScore,
    streakScore,
    trendScore,
    compositeScore,
    conviction,
    sizeMultiplier,
  };
}

const ORDER: Record<RiskState, number> = { calm: 0, watch: 1, derisk: 2 };

// Escalate the vault's funding-derived risk when SoSoValue flows say caution (outflows).
// This is where SoSoValue data changes vault behaviour.
export function escalateForFlow(base: RiskState, stance: FlowStance | undefined): RiskState {
  if (stance === "caution") return ORDER[base] >= ORDER.watch ? base : "watch";
  return base;
}

// A stronger escalation that also uses conviction: a high-conviction outflow pushes straight to
// de-risk, not just watch. Falls back to escalateForFlow when no regime is available.
export function escalateForRegime(base: RiskState, regime: FlowRegime | undefined): RiskState {
  if (!regime) return base;
  if (regime.compositeScore <= -0.5 && regime.conviction === "high") {
    return ORDER[base] >= ORDER.derisk ? base : "derisk";
  }
  return escalateForFlow(base, regime.stance);
}
