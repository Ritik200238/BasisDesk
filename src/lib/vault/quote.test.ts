import { describe, it, expect } from "vitest";
import { buildVaultQuote } from "./quote";
import type { VaultDef } from "./types";
import type { MarkPrice, PerpSymbol } from "@/lib/sodex";

const vault: VaultDef = {
  id: "btc-neutral",
  name: "BTC Market-Neutral",
  symbol: "BTC-USD",
  baseAsset: "BTC",
  targetLeverage: 3,
  blurb: "",
};

const mark: MarkPrice = {
  symbol: "BTC-USD",
  markPrice: "62725",
  indexPrice: "62758",
  openInterest: "220",
  fundingRate: "0.0000125",
  nextFundingTime: 1780826400000,
};

const spec: PerpSymbol = {
  name: "BTC-USD",
  maxLeverage: 25,
  marginTiers: [{ maxNotionalValue: "4000000", maintenanceMarginRate: "0.02", maxLeverage: 25 }],
  fundingInterval: 3600,
  takerFee: "0.0004",
};

describe("buildVaultQuote", () => {
  const q = buildVaultQuote(vault, mark, spec, new Date("2026-06-07T00:00:00Z"));

  it("annualizes the hourly funding rate on notional", () => {
    // 0.0000125 * 8760 hours
    expect(q.fundingAprOnNotional).toBeCloseTo(0.1095, 6);
    expect(q.fundingPositive).toBe(true);
  });

  it("scales funding to capital by L/(L+1) at 3x", () => {
    expect(q.fundingAprOnCapital).toBeCloseTo(0.1095 * (3 / 4), 6);
  });

  it("reads the real maintenance margin and taker fee from the spec", () => {
    expect(q.maintenanceMarginRate).toBe(0.02);
    expect(q.takerFee).toBe(0.0004);
  });

  it("estimates liquidation headroom for the short at 3x", () => {
    // 1/3 - 0.02
    expect(q.liquidationDistance).toBeCloseTo(1 / 3 - 0.02, 6);
  });

  it("classifies a healthy position as calm", () => {
    expect(q.risk.state).toBe("calm");
  });

  it("flags negative funding as a non-calm state", () => {
    const negMark: MarkPrice = { ...mark, fundingRate: "-0.00001" };
    const nq = buildVaultQuote(vault, negMark, spec, new Date());
    expect(nq.fundingPositive).toBe(false);
    expect(nq.fundingAprOnNotional).toBeLessThan(0);
    expect(nq.risk.state).not.toBe("calm");
  });
});
