// Server-side: fetch SoSoValue ETF flows and compute the regime. Discriminated result so
// the UI can distinguish "no key yet" from a real upstream error from genuinely empty data.

import {
  filterNewsByCurrency,
  getEtfSummaryHistory,
  getFeaturedNews,
  type EtfSummaryRecord,
  type NewsItem,
  type SsvError,
} from "@/lib/sosovalue";
import { computeFlowRegime, type FlowRegime } from "./regime";

// The API can return several records for the same date (revisions/intraday). Keep the first
// (primary) record per date so the streak/flip math sees one clean value per day.
function dedupeByDate(records: EtfSummaryRecord[]): EtfSummaryRecord[] {
  const seen = new Set<string>();
  const out: EtfSummaryRecord[] = [];
  for (const r of records) {
    if (seen.has(r.date)) continue;
    seen.add(r.date);
    out.push(r);
  }
  return out;
}

export type FlowRegimeResult =
  | { state: "ok"; regime: FlowRegime; asOf: string }
  | { state: "not_configured" }
  | { state: "empty" }
  | { state: "error"; error: SsvError };

// ETF flows are daily data, so cache stable results ~10 min. This keeps the live page
// auto-refresh from re-hitting SoSoValue's per-minute budget every tick. Errors and the
// not-configured state are never cached, so a fixed key or recovered upstream picks up at once.
const FLOW_TTL_MS = 10 * 60_000;
const flowCache = new Map<string, { at: number; result: FlowRegimeResult }>();
const newsCache = new Map<string, { at: number; result: FlowNewsResult }>();

// `symbol` is the SoSoValue asset symbol (e.g. "BTC", "ETH"), not the SoDEX market name.
export async function getFlowRegime(symbol: string): Promise<FlowRegimeResult> {
  const cached = flowCache.get(symbol);
  if (cached && Date.now() - cached.at < FLOW_TTL_MS) return cached.result;

  const res = await getEtfSummaryHistory(symbol, { limit: 30 });
  if (!res.ok) {
    if (res.error.kind === "not_configured") return { state: "not_configured" };
    // SoSoValue covers only certain crypto ETFs (BTC, ETH, SOL, LINK, …). An unsupported asset
    // such as gold (XAUT) is genuinely "no ETF data", not an upstream failure — surface it as
    // empty (and cache it) instead of a scary error state.
    if (res.error.status === 400 || /invalid parameter|40000?3/i.test(res.error.message)) {
      const empty: FlowRegimeResult = { state: "empty" };
      flowCache.set(symbol, { at: Date.now(), result: empty });
      return empty;
    }
    return { state: "error", error: res.error };
  }
  const regime = computeFlowRegime(symbol, dedupeByDate(res.data));
  const result: FlowRegimeResult = regime
    ? { state: "ok", regime, asOf: res.asOf.toISOString() }
    : { state: "empty" };
  flowCache.set(symbol, { at: Date.now(), result });
  return result;
}

// The most recent SoSoValue news item tagged with this asset — the grounded "why" behind a
// flow move. Returns the matched item only (never unrelated news).
export type FlowNewsResult =
  | { state: "ok"; item: NewsItem; asOf: string }
  | { state: "none" }
  | { state: "not_configured" }
  | { state: "error" };

export async function getTopFlowNews(symbol: string): Promise<FlowNewsResult> {
  const cached = newsCache.get(symbol);
  if (cached && Date.now() - cached.at < FLOW_TTL_MS) return cached.result;

  const res = await getFeaturedNews({ pageSize: 40 });
  if (!res.ok) {
    return res.error.kind === "not_configured" ? { state: "not_configured" } : { state: "error" };
  }
  const matched = filterNewsByCurrency(res.data, symbol).filter((n) => n.title && n.sourceLink);
  const top = matched.sort((a, b) => (b.releaseTime ?? 0) - (a.releaseTime ?? 0))[0];
  const result: FlowNewsResult = top
    ? { state: "ok", item: top, asOf: res.asOf.toISOString() }
    : { state: "none" };
  newsCache.set(symbol, { at: Date.now(), result });
  return result;
}
