import { describe, it, expect } from "vitest";
import { isNeutral, netDelta } from "./delta";
import { dn, toNum } from "./money";

describe("netDelta", () => {
  it("is zero when long and short quantities match", () => {
    const d = netDelta({ longQty: dn(0.01), shortQty: dn(0.01), price: dn(50000) });
    expect(toNum(d.deltaBaseQty)).toBe(0);
    expect(toNum(d.deltaUsd)).toBe(0);
    expect(d.deltaRatio).toBe(0);
    expect(isNeutral(d.deltaRatio)).toBe(true);
  });

  it("reports residual long exposure as a positive ratio of long notional", () => {
    const d = netDelta({ longQty: dn(0.01), shortQty: dn(0.009), price: dn(50000) });
    expect(toNum(d.deltaUsd)).toBeCloseTo(50, 6);
    expect(d.deltaRatio).toBeCloseTo(0.1, 9);
    expect(isNeutral(d.deltaRatio)).toBe(false);
    expect(isNeutral(d.deltaRatio, 0.2)).toBe(true);
  });

  it("does not divide by zero when there is no long leg", () => {
    const d = netDelta({ longQty: dn(0), shortQty: dn(0), price: dn(50000) });
    expect(d.deltaRatio).toBe(0);
  });
});
