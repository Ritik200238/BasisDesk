import { dAdd, dDiv, dMul, dn, ONE, toNum, type Dnum } from "./money";
import type { RiskAssessment, RiskInputs, RiskState } from "./types";

// Estimated liquidation price for an isolated short.
// The short is liquidated when its loss eats the margin down to the maintenance margin:
//   loss(short) = qty*(price - entry)
//   at liquidation: price_liq = entry * (1 + 1/L - maintenanceMarginRatio)
// Live positions should prefer the venue-reported liquidation price (`lp`); this estimate
// is for pre-trade previews before a position exists.
export function shortLiquidationPrice(
  entryPrice: Dnum,
  leverage: number,
  maintenanceMarginRatio: number,
): Dnum {
  const invLeverage = dDiv(ONE, dn(leverage));
  const factor = dAdd(dAdd(ONE, invLeverage), dn(-maintenanceMarginRatio));
  return dMul(entryPrice, factor);
}

// Fraction the price must rise from current to liquidate the short (positive = headroom).
export function shortLiquidationDistance(
  currentPrice: Dnum,
  entryPrice: Dnum,
  leverage: number,
  maintenanceMarginRatio: number,
): number {
  const liq = toNum(shortLiquidationPrice(entryPrice, leverage, maintenanceMarginRatio));
  const cur = toNum(currentPrice);
  if (cur === 0) return 0;
  return (liq - cur) / cur;
}

const SEVERITY: Record<RiskState, number> = { calm: 0, watch: 1, derisk: 2 };
const worst = (a: RiskState, b: RiskState): RiskState => (SEVERITY[a] >= SEVERITY[b] ? a : b);

// Classify vault risk from residual delta, distance to the short's liquidation, and the
// sign of funding. Thresholds are explicit so the UI can show exactly why a state fired.
export function classifyRisk(input: RiskInputs): RiskAssessment {
  const reasons: string[] = [];
  let state: RiskState = "calm";

  const deltaPct = Math.abs(input.deltaRatio) * 100;
  if (Math.abs(input.deltaRatio) > 0.1) {
    state = worst(state, "derisk");
    reasons.push(`net delta ${deltaPct.toFixed(1)}% exceeds the 10% hard limit`);
  } else if (Math.abs(input.deltaRatio) > 0.05) {
    state = worst(state, "watch");
    reasons.push(`net delta ${deltaPct.toFixed(1)}% is above the 5% target`);
  }

  const liqPct = input.liquidationDistance * 100;
  if (input.liquidationDistance < 0.05) {
    state = worst(state, "derisk");
    reasons.push(`short is ${liqPct.toFixed(1)}% from liquidation`);
  } else if (input.liquidationDistance < 0.15) {
    state = worst(state, "watch");
    reasons.push(`short is ${liqPct.toFixed(1)}% from liquidation`);
  }

  if (input.fundingApr < 0) {
    state = worst(state, "watch");
    reasons.push(`funding is negative (${(input.fundingApr * 100).toFixed(1)}% APR): the short pays`);
  }

  if (reasons.length === 0) {
    reasons.push("delta within tolerance, ample liquidation headroom, funding positive");
  }
  return { state, reasons };
}

// Maximum peak-to-trough decline over a NAV series, as a fraction.
export function maxDrawdown(navSeries: number[]): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const v of navSeries) {
    if (v > peak) peak = v;
    if (peak > 0) mdd = Math.max(mdd, (peak - v) / peak);
  }
  return mdd;
}
