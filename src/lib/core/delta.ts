import { dDiv, dMul, dSub, isZero, toNum } from "./money";
import type { DeltaInputs, DeltaResult } from "./types";

// Net price exposure of the long (spot) leg against the short (perp) leg.
// A delta-neutral vault aims for deltaBaseQty == 0; in practice price drift between
// rebalances leaves a small residual, reported as deltaRatio.
export function netDelta(input: DeltaInputs): DeltaResult {
  const deltaBaseQty = dSub(input.longQty, input.shortQty);
  const deltaUsd = dMul(deltaBaseQty, input.price);
  const longNotional = dMul(input.longQty, input.price);
  const deltaRatio = isZero(longNotional) ? 0 : toNum(dDiv(deltaUsd, longNotional));
  return { deltaBaseQty, deltaUsd, deltaRatio };
}

// Whether the residual exposure is inside the vault's neutrality tolerance (default 5%).
export function isNeutral(deltaRatio: number, tolerance = 0.05): boolean {
  return Math.abs(deltaRatio) <= tolerance;
}
