// Domain types for the deterministic finance core. No framework or network imports.

import type { Dnum } from "./money";

export type RiskState = "calm" | "watch" | "derisk";

// --- Position sizing ---

export interface SizingInputs {
  // User capital to deploy into the vault, in USD.
  capitalUsd: Dnum;
  // Current underlying price (USD per base unit), e.g. BTC/USD.
  price: Dnum;
  // Leverage on the short perp leg (>= 1). Higher leverage = more capital-efficient
  // funding yield but a closer liquidation price on the short.
  leverage: number;
}

export interface HedgedPosition {
  // Base-unit quantity held long (spot) and short (perp). Equal by construction so the
  // position is delta-neutral at entry.
  qty: Dnum;
  price: Dnum;
  longNotionalUsd: Dnum;
  shortNotionalUsd: Dnum;
  // Cash used to buy the spot leg.
  spotCostUsd: Dnum;
  // Margin posted for the short leg = shortNotional / leverage.
  marginUsd: Dnum;
  // Total capital consumed (spotCost + margin); equals SizingInputs.capitalUsd within rounding.
  capitalUsd: Dnum;
  leverage: number;
}

// --- Delta ---

export interface DeltaInputs {
  longQty: Dnum;
  shortQty: Dnum;
  price: Dnum;
}

export interface DeltaResult {
  // longQty - shortQty, in base units. Zero == perfectly hedged.
  deltaBaseQty: Dnum;
  // Residual USD exposure to the underlying.
  deltaUsd: Dnum;
  // Signed residual exposure as a fraction of the long notional. 0.03 == 3% net long.
  deltaRatio: number;
}

// --- Funding ---

// A realized funding payment to the short, taken from the venue's funding history.
// Positive fundingFeeUsd == earned (longs paid shorts).
export interface FundingEvent {
  timestampMs: number;
  fundingFeeUsd: Dnum;
}

// A funding-rate observation for one interval (hourly on SoDEX), as a fraction of notional.
export interface FundingRateSample {
  timestampMs: number;
  ratePerInterval: number;
}

// --- NAV / shares ---

export interface NavInputs {
  qty: Dnum;
  entryPrice: Dnum;
  currentPrice: Dnum;
  marginUsd: Dnum;
  realizedFundingUsd: Dnum;
  feesPaidUsd?: Dnum;
}

export interface NavResult {
  spotValueUsd: Dnum;
  shortUnrealizedPnlUsd: Dnum;
  perpEquityUsd: Dnum;
  navUsd: Dnum;
}

// --- Risk ---

export interface RiskInputs {
  deltaRatio: number;
  // Fraction the price must rise from current to liquidate the short (positive = headroom).
  liquidationDistance: number;
  // Current annualized funding on notional (negative = the short pays, yield turns negative).
  fundingApr: number;
}

export interface RiskAssessment {
  state: RiskState;
  reasons: string[];
}
