import { describe, it, expect } from "vitest";
import {
  classifyRisk,
  maxDrawdown,
  shortLiquidationDistance,
  shortLiquidationPrice,
} from "./risk";
import { dn, toNum } from "./money";

describe("liquidation", () => {
  it("places the short liquidation price above entry", () => {
    const liq = shortLiquidationPrice(dn(50000), 5, 0.005);
    expect(toNum(liq)).toBeCloseTo(50000 * (1 + 0.2 - 0.005), 2); // 59750
  });

  it("reports the distance from current price to liquidation", () => {
    const d = shortLiquidationDistance(dn(50000), dn(50000), 5, 0.005);
    expect(d).toBeCloseTo(0.195, 6);
  });
});

describe("classifyRisk", () => {
  it("is calm with tiny delta, far liquidation, positive funding", () => {
    expect(classifyRisk({ deltaRatio: 0, liquidationDistance: 0.2, fundingApr: 0.1 }).state).toBe(
      "calm",
    );
  });

  it("escalates to derisk when near liquidation", () => {
    expect(
      classifyRisk({ deltaRatio: 0, liquidationDistance: 0.04, fundingApr: 0.1 }).state,
    ).toBe("derisk");
  });

  it("escalates to derisk when delta breaches the hard limit", () => {
    expect(
      classifyRisk({ deltaRatio: 0.12, liquidationDistance: 0.2, fundingApr: 0.1 }).state,
    ).toBe("derisk");
  });

  it("flags watch when funding turns negative", () => {
    const r = classifyRisk({ deltaRatio: 0, liquidationDistance: 0.2, fundingApr: -0.05 });
    expect(r.state).toBe("watch");
    expect(r.reasons.some((x) => x.includes("funding"))).toBe(true);
  });
});

describe("maxDrawdown", () => {
  it("computes the largest peak-to-trough decline", () => {
    expect(maxDrawdown([100, 120, 90, 130, 80])).toBeCloseTo((130 - 80) / 130, 9);
  });
});
