import { describe, it, expect } from "vitest";
import {
  HOURS_PER_YEAR,
  accruedFunding,
  averageRate,
  fundingApr,
  fundingApy,
  fundingYieldOnCapital,
} from "./funding";
import { dn, toNum } from "./money";

describe("funding", () => {
  it("annualizes an hourly rate, compounded above simple", () => {
    expect(HOURS_PER_YEAR).toBe(8760);
    expect(fundingApr(0.00001)).toBeCloseTo(0.0876, 9);
    expect(fundingApy(0.00001)).toBeGreaterThan(fundingApr(0.00001));
  });

  it("averages samples and returns null on no data", () => {
    expect(averageRate([])).toBeNull();
    expect(
      averageRate([
        { timestampMs: 1, ratePerInterval: 0.0001 },
        { timestampMs: 2, ratePerInterval: 0.0003 },
      ]),
    ).toBeCloseTo(0.0002, 12);
  });

  it("scales yield from notional to capital by L/(L+1)", () => {
    expect(fundingYieldOnCapital(0.1, 1)).toBeCloseTo(0.05, 12);
    expect(fundingYieldOnCapital(0.1, 5)).toBeCloseTo(0.1 * (5 / 6), 12);
  });

  it("sums realized funding events without estimating", () => {
    const total = accruedFunding([
      { timestampMs: 1, fundingFeeUsd: dn(1.5) },
      { timestampMs: 2, fundingFeeUsd: dn(2.0) },
    ]);
    expect(toNum(total)).toBeCloseTo(3.5, 9);
  });
});
