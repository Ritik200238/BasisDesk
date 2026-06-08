// Public SoDEX perps market-data reads. No auth, no whitelist required — these power the
// pre-wallet insight surfaces (live funding rates -> market-neutral APY).

import { perpsUrl } from "./config";
import { getJson, type SodexResult } from "./http";
import {
  klinesSchema,
  markPricesSchema,
  perpSymbolsSchema,
  tickersSchema,
  type Kline,
  type MarkPrice,
  type PerpSymbol,
  type Ticker,
} from "./schemas";

// GET /markets/symbols — the tradable perp universe (BTC-USD, ETH-USD, ...). Each entry
// carries the real market spec: maxLeverage, marginTiers (maintenance margin), fees, and
// fundingInterval, which the vault math reads instead of assuming.
export function getPerpSymbols(): Promise<SodexResult<PerpSymbol[]>> {
  return getJson(perpsUrl("/markets/symbols"), perpSymbolsSchema);
}

// The full market spec for one symbol (keyed by `name`, e.g. "BTC-USD").
export async function getMarketSpec(name: string): Promise<SodexResult<PerpSymbol>> {
  const res = await getPerpSymbols();
  if (!res.ok) return res;
  const item = res.data.find((s) => s.name === name);
  if (!item) {
    return { ok: false, error: { kind: "upstream", message: `No SoDEX market spec for ${name}` } };
  }
  return { ok: true, data: item, asOf: res.asOf };
}

// GET /markets/mark-prices — mark price + estimated (hourly) funding rate per symbol.
export function getMarkPrices(symbol?: string): Promise<SodexResult<MarkPrice[]>> {
  return getJson(perpsUrl("/markets/mark-prices", symbol ? { symbol } : undefined), markPricesSchema);
}

// Convenience: the mark price for a single symbol.
export async function getMarkPrice(symbol: string): Promise<SodexResult<MarkPrice>> {
  const res = await getMarkPrices(symbol);
  if (!res.ok) return res;
  const item = res.data.find((d) => d.symbol === symbol) ?? res.data[0];
  if (!item) {
    return { ok: false, error: { kind: "upstream", message: `No mark price returned for ${symbol}` } };
  }
  return { ok: true, data: item, asOf: res.asOf };
}

// GET /markets/tickers — 24h stats + live funding/OI for every perp.
export function getTickers(): Promise<SodexResult<Ticker[]>> {
  return getJson(perpsUrl("/markets/tickers"), tickersSchema);
}

// The 24h ticker for one symbol.
export async function getTicker(symbol: string): Promise<SodexResult<Ticker>> {
  const res = await getTickers();
  if (!res.ok) return res;
  const item = res.data.find((t) => t.symbol === symbol);
  if (!item) {
    return { ok: false, error: { kind: "upstream", message: `No ticker for ${symbol}` } };
  }
  return { ok: true, data: item, asOf: res.asOf };
}

// GET /markets/{symbol}/klines — OHLCV candles for a price chart (default last 48 hours).
export function getKlines(
  symbol: string,
  interval = "1h",
  limit = 48,
): Promise<SodexResult<Kline[]>> {
  return getJson(perpsUrl(`/markets/${symbol}/klines`, { interval, limit: String(limit) }), klinesSchema);
}
