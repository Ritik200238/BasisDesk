import { describe, it, expect } from "vitest";
import { computeNav, sharePrice, sharesForDeposit, usdForRedeem } from "./vault";
import { sizeHedgedPosition } from "./sizing";
import { dn, toNum, ZERO } from "./money";

describe("computeNav", () => {
  it("is invariant to the underlying price (the market-neutral claim)", () => {
    const pos = sizeHedgedPosition({ capitalUsd: dn(1000), price: dn(50000), leverage: 1 });
    const base = {
      qty: pos.qty,
      entryPrice: dn(50000),
      marginUsd: pos.marginUsd,
      realizedFundingUsd: ZERO,
    };
    const crash = computeNav({ ...base, currentPrice: dn(40000) });
    const rally = computeNav({ ...base, currentPrice: dn(60000) });
    expect(toNum(crash.navUsd)).toBeCloseTo(1000, 6);
    expect(toNum(rally.navUsd)).toBeCloseTo(1000, 6);
  });

  it("moves only with realized funding", () => {
    const pos = sizeHedgedPosition({ capitalUsd: dn(1000), price: dn(50000), leverage: 1 });
    const nav = computeNav({
      qty: pos.qty,
      entryPrice: dn(50000),
      currentPrice: dn(55000),
      marginUsd: pos.marginUsd,
      realizedFundingUsd: dn(12.34),
    });
    expect(toNum(nav.navUsd)).toBeCloseTo(1012.34, 6);
  });
});

describe("shares", () => {
  it("prices the first deposit at 1.0 and round-trips a redeem", () => {
    expect(toNum(sharePrice(ZERO, ZERO))).toBe(1);
    const shares = sharesForDeposit(dn(1000), ZERO, ZERO);
    expect(toNum(shares)).toBeCloseTo(1000, 6);
    const out = usdForRedeem(shares, dn(1000), shares);
    expect(toNum(out)).toBeCloseTo(1000, 6);
  });

  it("gives a later depositor fewer shares once NAV has grown", () => {
    // 1000 shares already outstanding; NAV has grown to 1100 (share price 1.1)
    const shares = sharesForDeposit(dn(1100), dn(1100), dn(1000));
    expect(toNum(shares)).toBeCloseTo(1000, 6);
  });
});
