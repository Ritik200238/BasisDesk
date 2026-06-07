// Accumulated funding/flow history. The SoSoValue ETF window is ~30 days; recording our own
// snapshots over time is the moat (a track record nobody else has). The store is an interface
// so a real database can replace the default without touching callers.

import type { FlowStance } from "@/lib/flows";

export interface Snapshot {
  ts: number; // epoch ms
  symbol: string; // SoSoValue asset symbol, e.g. "BTC"
  fundingAprOnNotional: number;
  flowStance: FlowStance | "unknown";
  latestNetInflowUsd: number | null;
  flowStreakDays: number | null;
}

export interface HistoryStore {
  record(snapshot: Snapshot): Promise<void>;
  list(symbol: string, sinceMs?: number): Promise<Snapshot[]>;
}
