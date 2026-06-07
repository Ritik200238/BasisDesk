import { describe, it, expect } from "vitest";
import { sizeHedgedPosition } from "./sizing";
import { dn, toNum } from "./money";

describe("sizeHedgedPosition", () => {
  it("splits capital into equal spot and margin at 1x and stays delta-neutral", () => {
    const p = sizeHedgedPosition({ capitalUsd: dn(1000), price: dn(50000), leverage: 1 });
    expect(toNum(p.qty)).toBeCloseTo(0.01, 9);
    expect(toNum(p.spotCostUsd)).toBeCloseTo(500, 6);
    expect(toNum(p.marginUsd)).toBeCloseTo(500, 6);
    expect(toNum(p.capitalUsd)).toBeCloseTo(1000, 6);
    // long and short notionals equal => neutral at entry
    expect(toNum(p.longNotionalUsd)).toBeCloseTo(toNum(p.shortNotionalUsd), 9);
  });

  it("posts less margin at higher leverage but conserves total capital", () => {
    const p = sizeHedgedPosition({ capitalUsd: dn(1000), price: dn(50000), leverage: 5 });
    expect(toNum(p.qty)).toBeCloseTo(1000 / (50000 * 1.2), 9);
    expect(toNum(p.marginUsd)).toBeCloseTo(toNum(p.shortNotionalUsd) / 5, 6);
    expect(toNum(p.capitalUsd)).toBeCloseTo(1000, 6);
  });

  it("rejects leverage below 1", () => {
    expect(() =>
      sizeHedgedPosition({ capitalUsd: dn(1000), price: dn(50000), leverage: 0.5 }),
    ).toThrow();
  });
});
