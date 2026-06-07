import { describe, it, expect } from "vitest";
import { computeDepositPreview } from "./preview";

describe("computeDepositPreview", () => {
  const p = computeDepositPreview({
    capitalUsd: 1000,
    markPrice: 62725,
    leverage: 3,
    maintenanceMarginRate: 0.02,
    takerFee: 0.0004,
  });

  it("splits capital into a 3x-hedged spot + margin position", () => {
    expect(p.spotCostUsd).toBeCloseTo(750, 4);
    expect(p.marginUsd).toBeCloseTo(250, 4);
    expect(p.spotCostUsd + p.marginUsd).toBeCloseTo(1000, 4);
    expect(p.shortNotionalUsd).toBeCloseTo(750, 4);
  });

  it("is delta-neutral at entry", () => {
    expect(p.netDeltaUsd).toBe(0);
    expect(p.qty).toBeCloseTo(750 / 62725, 8);
  });

  it("places the short liquidation above the mark with real headroom", () => {
    expect(p.liquidationPrice).toBeCloseTo(62725 * (1 + 1 / 3 - 0.02), 0);
    expect(p.liquidationDistance).toBeCloseTo(1 / 3 - 0.02, 6);
  });

  it("charges taker fees on both legs", () => {
    expect(p.entryFeesUsd).toBeCloseTo((750 + 750) * 0.0004, 6);
  });
});
