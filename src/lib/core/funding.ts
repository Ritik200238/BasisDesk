import { dAdd, ZERO, type Dnum } from "./money";
import type { FundingEvent, FundingRateSample } from "./types";

// SoDEX funding settles hourly.
export const HOURS_PER_YEAR = 24 * 365; // 8760

// Simple (non-compounded) annualized funding on notional from a per-interval rate.
export function fundingApr(ratePerInterval: number, intervalsPerYear = HOURS_PER_YEAR): number {
  return ratePerInterval * intervalsPerYear;
}

// Compounded annualized funding on notional from a per-interval rate.
export function fundingApy(ratePerInterval: number, intervalsPerYear = HOURS_PER_YEAR): number {
  return Math.pow(1 + ratePerInterval, intervalsPerYear) - 1;
}

// Mean per-interval rate across observed samples. Returns null when there is no data,
// so callers render an explicit "not enough signal" state instead of a fabricated 0.
export function averageRate(samples: FundingRateSample[]): number | null {
  if (samples.length === 0) return null;
  const sum = samples.reduce((acc, s) => acc + s.ratePerInterval, 0);
  return sum / samples.length;
}

// Funding is earned on the short notional, but the user's capital also funds the spot leg,
// so yield-on-capital is lower than yield-on-notional. With margin = notional/L, capital =
// notional*(1 + 1/L), hence notional/capital = L/(L+1).
export function fundingYieldOnCapital(aprOnNotional: number, leverage: number): number {
  const capitalEfficiency = leverage / (leverage + 1);
  return aprOnNotional * capitalEfficiency;
}

// Sum of realized funding payments. Operates only on figures pulled from the venue's
// funding history; never estimates.
export function accruedFunding(events: FundingEvent[]): Dnum {
  return events.reduce<Dnum>((acc, e) => dAdd(acc, e.fundingFeeUsd), ZERO);
}
