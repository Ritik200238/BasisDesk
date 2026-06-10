import {
  computeNav,
  dn,
  shortLiquidationPrice,
  sizeHedgedPosition,
  toNum,
} from "@/lib/core";

export interface SimulateInput {
  capitalUsd: number;
  entryPrice: number;
  newPrice: number;
  leverage: number;
  maintenanceMarginRate: number;
  takerFee: number;
  fundingAprOnNotional: number;
  holdingDays: number;
}

export interface SimulateResult {
  priceChangePct: number;
  // BasisDesk hedged position
  hedgedValueUsd: number;
  hedgedPnlUsd: number;
  hedgedPnlPct: number;
  spotValueUsd: number;
  shortPnlUsd: number;
  fundingEarnedUsd: number;
  liquidated: boolean;
  liquidationPrice: number;
  // The contrast: the same capital simply held as spot
  holdValueUsd: number;
  holdPnlUsd: number;
  holdPnlPct: number;
}

// Compute, at an arbitrary price, what a hedged BasisDesk position is worth versus simply
// holding the asset. Built on the deterministic core: computeNav is price-invariant within the
// short's liquidation band, so the hedged value moves only with funding and fees — the product
// claim, made interactive. Above the short's liquidation price the hedge breaks (the short is
// wiped, its margin lost) and the position is left long spot; that is modeled honestly here.
export function simulateScenario(input: SimulateInput): SimulateResult {
  const pos = sizeHedgedPosition({
    capitalUsd: dn(input.capitalUsd),
    price: dn(input.entryPrice),
    leverage: input.leverage,
  });
  const qty = toNum(pos.qty);
  const marginUsd = toNum(pos.marginUsd);
  const spotCostUsd = toNum(pos.spotCostUsd);
  const shortNotionalUsd = toNum(pos.shortNotionalUsd);

  const liquidationPrice = toNum(
    shortLiquidationPrice(dn(input.entryPrice), input.leverage, input.maintenanceMarginRate),
  );
  const liquidated = input.newPrice >= liquidationPrice;

  const entryFeesUsd = (spotCostUsd + shortNotionalUsd) * input.takerFee;
  const fundingEarnedUsd = shortNotionalUsd * input.fundingAprOnNotional * (input.holdingDays / 365);

  const spotValueUsd = qty * input.newPrice;

  let hedgedValueUsd: number;
  let shortPnlUsd: number;
  if (liquidated) {
    // Short liquidated: its margin is consumed, the perp leg is closed, and the position is left
    // holding the (now-appreciated) spot. Funding accrued up to here still counts; fees subtract.
    shortPnlUsd = -marginUsd;
    hedgedValueUsd = spotValueUsd + fundingEarnedUsd - entryFeesUsd;
  } else {
    shortPnlUsd = qty * (input.entryPrice - input.newPrice);
    const nav = computeNav({
      qty: pos.qty,
      entryPrice: dn(input.entryPrice),
      currentPrice: dn(input.newPrice),
      marginUsd: pos.marginUsd,
      realizedFundingUsd: dn(fundingEarnedUsd),
      feesPaidUsd: dn(entryFeesUsd),
    });
    hedgedValueUsd = toNum(nav.navUsd);
  }

  // Same capital, simply bought as spot and held — the natural mental comparison.
  const holdValueUsd = input.capitalUsd * (input.newPrice / input.entryPrice);

  return {
    priceChangePct: input.newPrice / input.entryPrice - 1,
    hedgedValueUsd,
    hedgedPnlUsd: hedgedValueUsd - input.capitalUsd,
    hedgedPnlPct: (hedgedValueUsd - input.capitalUsd) / input.capitalUsd,
    spotValueUsd,
    shortPnlUsd,
    fundingEarnedUsd,
    liquidated,
    liquidationPrice,
    holdValueUsd,
    holdPnlUsd: holdValueUsd - input.capitalUsd,
    holdPnlPct: holdValueUsd / input.capitalUsd - 1,
  };
}
