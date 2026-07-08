// Server-side: fetch SoSoValue ETF flows and compute the regime. Discriminated result so
// the UI can distinguish "no key yet" from a real upstream error from genuinely empty data.
//
// Caching is durable and cross-instance via Next's Data Cache (unstable_cache), not a per-process
// Map: with 11 vaults on the board, a per-instance cache lets every cold serverless instance
// re-hit SoSoValue's per-minute budget and trip its rate limit. The Data Cache is shared across
// instances, so each symbol's ETF series (and the one featured-news list) is fetched at most once
// per revalidate window globally. Only stable outcomes are cached — a successful series or a
// genuine "unsupported symbol"; transient failures throw so nothing bad is cached and the next
// request retries.

import { unstable_cache } from "next/cache";
import {
  filterNewsByCurrency,
  getEtfSummaryHistory,
  getFeaturedNews,
  type EtfSummaryRecord,
  type NewsItem,
  type SsvError,
  type SsvErrorKind,
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

const REVALIDATE_SEC = 600; // 10 min — ETF flows are daily data.

type CachedSeries =
  | { kind: "ok"; data: EtfSummaryRecord[]; asOf: number }
  | { kind: "unsupported" };

// Durable per-symbol cache of the raw ETF series. `symbol` is part of the cache key (it is an
// argument). Throws on transient/no-key errors so they are never cached.
const cachedEtfSeries = unstable_cache(
  async (symbol: string): Promise<CachedSeries> => {
    const res = await getEtfSummaryHistory(symbol, { limit: 30 });
    if (res.ok) return { kind: "ok", data: res.data, asOf: res.asOf.getTime() };
    // SoSoValue covers only certain crypto ETFs. An unsupported asset (e.g. gold, SOSO) returns
    // HTTP 400 — genuinely "no ETF data", a stable outcome worth caching as empty.
    if (res.error.status === 400 || /invalid parameter|40000?3/i.test(res.error.message)) {
      return { kind: "unsupported" };
    }
    throw new Error(res.error.kind); // transient (rate_limited/5xx) or not_configured — do not cache
  },
  ["ssv-etf-series-v1"],
  { revalidate: REVALIDATE_SEC },
);

// `symbol` is the SoSoValue asset symbol (e.g. "BTC", "ETH"), not the SoDEX market name.
export async function getFlowRegime(symbol: string): Promise<FlowRegimeResult> {
  let series: CachedSeries;
  try {
    series = await cachedEtfSeries(symbol);
  } catch (err) {
    const kind = (err instanceof Error ? err.message : "network") as SsvErrorKind;
    if (kind === "not_configured") return { state: "not_configured" };
    return { state: "error", error: { kind, message: "SoSoValue temporarily unavailable" } };
  }
  if (series.kind === "unsupported") return { state: "empty" };
  const regime = computeFlowRegime(symbol, dedupeByDate(series.data));
  return regime
    ? { state: "ok", regime, asOf: new Date(series.asOf).toISOString() }
    : { state: "empty" };
}

// The most recent SoSoValue news item tagged with this asset — the grounded "why" behind a
// flow move. Returns the matched item only (never unrelated news).
export type FlowNewsResult =
  | { state: "ok"; item: NewsItem; asOf: string }
  | { state: "none" }
  | { state: "not_configured" }
  | { state: "error" };

// Featured news is symbol-independent (one list, filtered per asset client-side), so cache the
// raw list durably once for the whole board.
const cachedFeaturedNews = unstable_cache(
  async (): Promise<{ items: NewsItem[]; asOf: number }> => {
    const res = await getFeaturedNews({ pageSize: 40 });
    if (res.ok) return { items: res.data, asOf: res.asOf.getTime() };
    throw new Error(res.error.kind);
  },
  ["ssv-featured-news-v1"],
  { revalidate: REVALIDATE_SEC },
);

export async function getTopFlowNews(symbol: string): Promise<FlowNewsResult> {
  let news: { items: NewsItem[]; asOf: number };
  try {
    news = await cachedFeaturedNews();
  } catch (err) {
    const kind = err instanceof Error ? err.message : "network";
    return kind === "not_configured" ? { state: "not_configured" } : { state: "error" };
  }
  const matched = filterNewsByCurrency(news.items, symbol).filter((n) => n.title && n.sourceLink);
  const top = matched.sort((a, b) => (b.releaseTime ?? 0) - (a.releaseTime ?? 0))[0];
  return top
    ? { state: "ok", item: top, asOf: new Date(news.asOf).toISOString() }
    : { state: "none" };
}
