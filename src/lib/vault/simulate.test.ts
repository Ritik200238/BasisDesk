import { describe, it, expect } from "vitest";
import { simulateScenario, type SimulateInput } from "./simulate";

const base: Omit<SimulateInput, "newPrice"> = {
  capitalUsd: 1000,
  entryPrice: 63000,
  leverage: 3,
  maintenanceMarginRate: 0.02,
  takerFee: 0.0005,
  fundingAprOnNotional: 0.1095,
  holdingDays: 30,
};

const at = (newPrice: number) => simulateScenario({ ...base, newPrice });

describe("simulateScenario", () => {
  it("keeps the hedged value flat (to the cent) below the short's liquidation price", () => {
    const liq = at(base.entryPrice).liquidationPrice;
    const prices = [base.entryPrice * 0.5, base.entryPrice * 0.8, base.entryPrice, base.entryPrice * 1.1].filter(
      (p) => p < liq,
    );
    const values = prices.map((p) => at(p).hedgedValueUsd);
    const spread = Math.max(...values) - Math.min(...values);
    expect(spread).toBeLessThan(0.01);
  });

  it("holds ~capital while simply holding craters on a 40% drop", () => {
    const s = at(base.entryPrice * 0.6);
    expect(s.holdPnlPct).toBeCloseTo(-0.4, 5);
    expect(s.liquidated).toBe(false);
    expect(s.hedgedPnlPct).toBeGreaterThan(0); // flat on price, up on funding
    expect(s.hedgedValueUsd).toBeGreaterThan(s.holdValueUsd);
  });

  it("earns funding over the holding period, net of entry fees", () => {
    const s = at(base.entryPrice);
    expect(s.fundingEarnedUsd).toBeGreaterThan(0);
    expect(s.hedgedPnlUsd).toBeGreaterThan(0);
    expect(s.hedgedPnlUsd).toBeLessThan(s.fundingEarnedUsd);
  });

  it("breaks the hedge above the short's liquidation price (left long spot)", () => {
    const liq = at(base.entryPrice).liquidationPrice;
    const s = at(liq * 1.05);
    expect(s.liquidated).toBe(true);
    expect(at(liq * 1.15).hedgedValueUsd).toBeGreaterThan(s.hedgedValueUsd);
  });
});
