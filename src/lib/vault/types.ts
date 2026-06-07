import type { RiskAssessment } from "@/lib/core";

// A vault definition: a market-neutral strategy on one SoDEX perp market.
export interface VaultDef {
  id: string;
  name: string;
  // SoDEX market name, e.g. "BTC-USD".
  symbol: string;
  baseAsset: string;
  blurb: string;
  // Leverage on the short (perp) leg. Higher = more capital-efficient funding yield but a
  // closer liquidation price on the short.
  targetLeverage: number;
}

// A deterministic, point-in-time quote for a vault, derived from live SoDEX data by the
// core math. All figures are computed in code, never by an LLM.
export interface VaultQuote {
  vault: VaultDef;
  // SoDEX numeric market id (from GET /markets/symbols), needed to place orders.
  symbolId: number | null;
  markPrice: number;
  // Per-interval (hourly) funding rate from SoDEX. Positive = the short is paid.
  fundingRatePerInterval: number;
  fundingIntervalSec: number;
  // Annualized (simple) funding on the short notional.
  fundingAprOnNotional: number;
  // Annualized funding on the depositor's capital at targetLeverage (notional/capital scaling).
  fundingAprOnCapital: number;
  maintenanceMarginRate: number;
  takerFee: number;
  // Fraction the price must rise to liquidate the short at entry (positive = headroom).
  liquidationDistance: number;
  nextFundingTime: number;
  fundingPositive: boolean;
  risk: RiskAssessment;
  // ISO timestamp of the underlying SoDEX read, safe to pass to client components.
  asOf: string;
  sources: { markPrice: string; spec: string };
}
