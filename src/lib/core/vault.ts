import { cmp, dAdd, dDiv, dMul, dSub, ONE, ZERO, type Dnum } from "./money";
import type { NavInputs, NavResult } from "./types";

// Net asset value of a delta-neutral position.
//
// spotValue        = qty * currentPrice
// shortUnrealized  = qty * (entryPrice - currentPrice)   (a short gains as price falls)
// perpEquity       = margin + shortUnrealized + realizedFunding - fees
// nav              = spotValue + perpEquity
//
// Substituting, nav = qty*entryPrice + margin + realizedFunding - fees, i.e. the price term
// cancels: NAV is invariant to the underlying price and moves only with funding and fees.
// That invariance is the product claim, and it is asserted directly in the test suite.
export function computeNav(input: NavInputs): NavResult {
  const fees = input.feesPaidUsd ?? ZERO;
  const spotValueUsd = dMul(input.qty, input.currentPrice);
  const shortUnrealizedPnlUsd = dMul(input.qty, dSub(input.entryPrice, input.currentPrice));
  const perpEquityUsd = dSub(
    dAdd(dAdd(input.marginUsd, shortUnrealizedPnlUsd), input.realizedFundingUsd),
    fees,
  );
  const navUsd = dAdd(spotValueUsd, perpEquityUsd);
  return { spotValueUsd, shortUnrealizedPnlUsd, perpEquityUsd, navUsd };
}

// Share price for the vault. The first deposit (no shares yet) prices shares at 1.0 USD.
export function sharePrice(navUsd: Dnum, totalShares: Dnum): Dnum {
  if (cmp(totalShares, 0) === 0) return ONE;
  return dDiv(navUsd, totalShares);
}

export function sharesForDeposit(depositUsd: Dnum, navUsd: Dnum, totalShares: Dnum): Dnum {
  return dDiv(depositUsd, sharePrice(navUsd, totalShares));
}

export function usdForRedeem(shares: Dnum, navUsd: Dnum, totalShares: Dnum): Dnum {
  return dMul(shares, sharePrice(navUsd, totalShares));
}
