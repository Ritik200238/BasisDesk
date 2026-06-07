import { dn, dAdd, dDiv, dMul, ONE } from "./money";
import type { HedgedPosition, SizingInputs } from "./types";

// Size a delta-neutral position for a given capital amount.
//
// The position holds qty units of spot (cost = qty*price) and shorts qty units of the
// perp (margin = qty*price/leverage). To be neutral the two quantities must be equal, so:
//   capital = qty*price + qty*price/leverage = qty*price*(1 + 1/leverage)
// => qty = capital / (price * (1 + 1/leverage))
//
// All intermediate steps stay in dnum; 1/leverage is computed as an exact dnum division,
// not a JS float, to keep the result reproducible across runs.
export function sizeHedgedPosition(input: SizingInputs): HedgedPosition {
  const { capitalUsd, price, leverage } = input;
  if (!(leverage >= 1)) {
    throw new Error(`leverage must be >= 1, received ${leverage}`);
  }

  const invLeverage = dDiv(ONE, dn(leverage)); // 1 / L
  const capitalPerUnit = dMul(price, dAdd(ONE, invLeverage)); // price * (1 + 1/L)
  const qty = dDiv(capitalUsd, capitalPerUnit);

  const notional = dMul(qty, price);
  const margin = dDiv(notional, dn(leverage));

  return {
    qty,
    price,
    longNotionalUsd: notional,
    shortNotionalUsd: notional,
    spotCostUsd: notional,
    marginUsd: margin,
    capitalUsd: dAdd(notional, margin),
    leverage,
  };
}
