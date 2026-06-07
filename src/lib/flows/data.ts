// Server-side: fetch SoSoValue ETF flows and compute the regime. Discriminated result so
// the UI can distinguish "no key yet" from a real upstream error from genuinely empty data.

import {
  filterNewsByCurrency,
  getEtfSummaryHistory,
  getFeaturedNews,
  type NewsItem,
  type SsvError,
} from "@/lib/sosovalue";
import { computeFlowRegime, type FlowRegime } from "./regime";

export type FlowRegimeResult =
  | { state: "ok"; regime: FlowRegime; asOf: string }
  | { state: "not_configured" }
  | { state: "empty" }
  | { state: "error"; error: SsvError };

// `symbol` is the SoSoValue asset symbol (e.g. "BTC", "ETH"), not the SoDEX market name.
export async function getFlowRegime(symbol: string): Promise<FlowRegimeResult> {
  const res = await getEtfSummaryHistory(symbol, { limit: 30 });
  if (!res.ok) {
    if (res.error.kind === "not_configured") return { state: "not_configured" };
    return { state: "error", error: res.error };
  }
  const regime = computeFlowRegime(symbol, res.data);
  if (!regime) return { state: "empty" };
  return { state: "ok", regime, asOf: res.asOf.toISOString() };
}

// The most recent SoSoValue news item tagged with this asset — the grounded "why" behind a
// flow move. Returns the matched item only (never unrelated news).
export type FlowNewsResult =
  | { state: "ok"; item: NewsItem; asOf: string }
  | { state: "none" }
  | { state: "not_configured" }
  | { state: "error" };

export async function getTopFlowNews(symbol: string): Promise<FlowNewsResult> {
  const res = await getFeaturedNews({ pageSize: 40 });
  if (!res.ok) {
    return res.error.kind === "not_configured" ? { state: "not_configured" } : { state: "error" };
  }
  const matched = filterNewsByCurrency(res.data, symbol).filter((n) => n.title && n.source_link);
  const top = matched.sort((a, b) => (b.release_time ?? 0) - (a.release_time ?? 0))[0];
  return top ? { state: "ok", item: top, asOf: res.asOf.toISOString() } : { state: "none" };
}
