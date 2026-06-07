// Decimal-safe money layer. All monetary and token-quantity math in the core runs
// through dnum (bigint fixed-point) so we never use IEEE floats for amounts, prices,
// or balances. Derived ratios (delta ratio, APR) are converted to `number` only at the
// edge, for display and threshold comparisons, after the exact math is done.

import {
  from,
  add,
  subtract,
  multiply,
  divide,
  compare,
  abs,
  toNumber,
  type Dnum,
  type Numberish,
} from "dnum";

export type { Dnum, Numberish };

// 18 decimals is enough headroom for token base units (BTC 8dp, USDC 6dp, ETH 18dp)
// and for USD notionals without precision loss in intermediate products.
export const PRECISION = 18;

export const dn = (value: Numberish): Dnum => from(value, PRECISION);
export const ZERO: Dnum = dn(0);
export const ONE: Dnum = dn(1);

export const dAdd = (a: Numberish, b: Numberish): Dnum => add(a, b, PRECISION);
export const dSub = (a: Numberish, b: Numberish): Dnum => subtract(a, b, PRECISION);
export const dMul = (a: Numberish, b: Numberish): Dnum => multiply(a, b, PRECISION);
export const dDiv = (a: Numberish, b: Numberish): Dnum => divide(a, b, PRECISION);
export const dAbs = (a: Numberish): Dnum => abs(a, PRECISION);
export const cmp = (a: Numberish, b: Numberish): -1 | 0 | 1 => compare(a, b);
export const toNum = (a: Dnum): number => toNumber(a);
export const isZero = (a: Numberish): boolean => compare(a, 0) === 0;
