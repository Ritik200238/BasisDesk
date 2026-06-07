import { describe, it, expect } from "vitest";
import {
  MISSING,
  formatBps,
  formatCompactUsd,
  formatPercent,
  formatPrice,
  formatQty,
  formatSignedUsd,
  formatUsd,
  withMissing,
} from "./index";

describe("formatUsd", () => {
  it("formats cents with grouping", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });
  it("shows an explicit sign when asked, with the symbol after the sign", () => {
    expect(formatUsd(1234.5, { signed: true })).toBe("+$1,234.50");
    expect(formatUsd(-50, { dp: 0 })).toBe("-$50");
  });
  it("compacts large notionals with a magnitude suffix", () => {
    expect(formatCompactUsd(2_100_000_000)).toBe("$2.1B");
  });
  it("always signs PnL/funding figures", () => {
    expect(formatSignedUsd(12.34)).toBe("+$12.34");
  });
});

describe("formatPercent / formatBps", () => {
  it("treats input as a ratio and appends a timeframe", () => {
    expect(formatPercent(0.024, { signed: true, timeframe: "24h" })).toBe("+2.40% (24h)");
    expect(formatPercent(0.1423, { timeframe: "7d funding avg" })).toBe("14.23% (7d funding avg)");
  });
  it("renders small funding rates in basis points", () => {
    expect(formatBps(0.0001)).toBe("1 bps");
    expect(formatBps(0.00005, { dp: 1, signed: true })).toBe("+0.5 bps");
  });
});

describe("formatPrice / formatQty", () => {
  it("formats a mark price and a token quantity with its unit", () => {
    expect(formatPrice(64210.5)).toBe("$64,210.50");
    expect(formatQty(0.5, { unit: "BTC" })).toBe("0.5000 BTC");
  });
});

describe("withMissing", () => {
  it("renders a dash for absent data, never a fabricated zero", () => {
    const usdOrDash = withMissing(formatUsd);
    expect(usdOrDash(undefined)).toBe(MISSING);
    expect(usdOrDash(null)).toBe(MISSING);
    expect(usdOrDash(100)).toBe("$100.00");
  });
});
