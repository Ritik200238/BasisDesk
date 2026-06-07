// Flow regime: turn a SoSoValue daily ETF-flow series into a stateful stance the vault acts
// on. This is the load-bearing link — institutional outflows are what tell the vault to
// de-risk. Pure and deterministic; the LLM never computes this.

import type { RiskState } from "@/lib/core";
import type { EtfSummaryRecord } from "@/lib/sosovalue";

export type FlowDirection = "inflow" | "outflow" | "flat";
export type FlowStance = "supportive" | "neutral" | "caution";

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
}

function direction(x: number): FlowDirection {
  if (x > 0) return "inflow";
  if (x < 0) return "outflow";
  return "flat";
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
  };
}

const ORDER: Record<RiskState, number> = { calm: 0, watch: 1, derisk: 2 };

// Escalate the vault's funding-derived risk when SoSoValue flows say caution (outflows).
// This is where SoSoValue data changes vault behaviour.
export function escalateForFlow(base: RiskState, stance: FlowStance | undefined): RiskState {
  if (stance === "caution") return ORDER[base] >= ORDER.watch ? base : "watch";
  return base;
}
