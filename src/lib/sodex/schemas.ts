// zod schemas for SoDEX perps REST responses. Shapes were confirmed by probing the LIVE
// testnet gateway (the published docs were partly stale: the funding field is `fundingRate`
// not `estimatedFundingRate`, the envelope is { code, timestamp, data }, and markets are
// keyed by `name`). High-precision numeric fields stay as strings so the deterministic core
// converts them with dnum. Fields the product depends on are required so a changed response
// fails loudly; descriptive extras are optional for resilience.
//
// Verified against: GET https://testnet-gw.sodex.dev/api/v1/perps/markets/{symbols,mark-prices}

import { z } from "zod";

// One row of the leverage/maintenance-margin tier table. maintenanceMarginRate feeds the
// liquidation-distance math in the core risk module (real value, not an assumption).
export const marginTierSchema = z.object({
  maxNotionalValue: z.string(),
  maintenanceMarginRate: z.string(),
  maxLeverage: z.number(),
  maintenanceDeduction: z.string().optional(),
});
export type MarginTier = z.infer<typeof marginTierSchema>;

// GET /markets/symbols — full market spec. `name` (e.g. "BTC-USD") is the market id.
export const perpSymbolSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  displayName: z.string().optional(),
  baseCoin: z.string().optional(),
  quoteCoin: z.string().optional(),
  pricePrecision: z.number().optional(),
  tickSize: z.string().optional(),
  quantityPrecision: z.number().optional(),
  stepSize: z.string().optional(),
  minQuantity: z.string().optional(),
  maxQuantity: z.string().optional(),
  minNotional: z.string().optional(),
  maxNotional: z.string().optional(),
  maxLeverage: z.number(),
  initLeverage: z.number().optional(),
  marginTiers: z.array(marginTierSchema).optional(),
  fundingInterval: z.number().optional(), // seconds; 3600 = hourly
  interestRate: z.string().optional(),
  maxFundingRate: z.string().optional(),
  minFundingRate: z.string().optional(),
  makerFee: z.string().optional(),
  takerFee: z.string().optional(),
  status: z.string().optional(),
});
export type PerpSymbol = z.infer<typeof perpSymbolSchema>;
export const perpSymbolsSchema = z.array(perpSymbolSchema);

// GET /markets/mark-prices — fundingRate is the per-interval (hourly) rate, the yield source.
export const markPriceSchema = z.object({
  symbol: z.string(),
  markPrice: z.string(),
  indexPrice: z.string().optional(),
  openInterest: z.string().optional(),
  fundingRate: z.string(),
  nextFundingTime: z.coerce.number(),
});
export type MarkPrice = z.infer<typeof markPriceSchema>;
export const markPricesSchema = z.array(markPriceSchema);

// GET /accounts/{address}/positions -> { positions: [...] }.
// Doc-derived; not yet probed against a live whitelisted account, so non-essential fields
// are optional. Re-verify field names once testnet trading access is granted.
export const perpPositionSchema = z.object({
  symbol: z.string(),
  positionID: z.coerce.number().optional(),
  size: z.string(),
  entryPrice: z.string(),
  unrealizedPnL: z.string().optional(),
  liquidationPrice: z.string().optional(),
  leverage: z.number().optional(),
  marginType: z.string().optional(),
});
export type PerpPosition = z.infer<typeof perpPositionSchema>;
export const positionsDataSchema = z.object({ positions: z.array(perpPositionSchema) });

// GET /markets/tickers — 24h rolling stats plus live funding/OI per symbol. Probe-verified
// against the testnet gateway. Product-critical fields required; descriptive extras optional.
export const tickerSchema = z.object({
  symbol: z.string(),
  lastPx: z.string(),
  openPx: z.string().optional(),
  highPx: z.string().optional(),
  lowPx: z.string().optional(),
  volume: z.string().optional(),
  quoteVolume: z.string().optional(),
  change: z.string().optional(),
  changePct: z.number().optional(),
  markPrice: z.string(),
  indexPrice: z.string().optional(),
  fundingRate: z.string(),
  openInterest: z.string().optional(),
  nextFundingTime: z.coerce.number().optional(),
});
export type Ticker = z.infer<typeof tickerSchema>;
export const tickersSchema = z.array(tickerSchema);

// GET /markets/{symbol}/klines — OHLCV candles. Probe-verified: t (ms), o/h/l/c, v (base), q (quote).
export const klineSchema = z.object({
  t: z.coerce.number(),
  o: z.string(),
  h: z.string(),
  l: z.string(),
  c: z.string(),
  v: z.string().optional(),
  q: z.string().optional(),
});
export type Kline = z.infer<typeof klineSchema>;
export const klinesSchema = z.array(klineSchema);

// GET /accounts/{address}/state — derives the account id (aid) for any address, plus
// margin/equity fields. Probe-verified: any address resolves to an aid (no whitelist to read).
export const accountStateSchema = z.object({
  user: z.string().optional(),
  aid: z.number(),
  uid: z.number().optional(),
  av: z.string().optional(),
  am: z.string().optional(),
});
export type AccountState = z.infer<typeof accountStateSchema>;

// GET /accounts/{address}/fundings — realized funding. Doc-derived (see note above).
export const fundingEventSchema = z.object({
  symbol: z.string(),
  positionID: z.coerce.number().optional(),
  fundingRate: z.string().optional(),
  fundingAmount: z.string(),
  fundingTime: z.coerce.number(),
});
export type FundingEventRaw = z.infer<typeof fundingEventSchema>;
export const fundingsSchema = z.array(fundingEventSchema);
