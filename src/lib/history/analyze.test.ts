import { describe, it, expect } from "vitest";
import { summarizeHistory } from "./analyze";
import type { Snapshot } from "./types";

function snap(ts: number, apr: number): Snapshot {
  return { ts, symbol: "BTC", fundingAprOnNotional: apr, flowStance: "supportive", latestNetInflowUsd: 1, flowStreakDays: 1 };
}

describe("summarizeHistory", () => {
  it("returns empty summary for no snapshots", () => {
    const s = summarizeHistory([]);
    expect(s.count).toBe(0);
    expect(s.latest).toBeNull();
    expect(s.fundingAprChange).toBeNull();
  });

  it("computes change since the previous reading and the average", () => {
    const s = summarizeHistory([snap(3, 0.12), snap(1, 0.1), snap(2, 0.11)]);
    expect(s.count).toBe(3);
    expect(s.latest?.ts).toBe(3);
    expect(s.previous?.ts).toBe(2);
    expect(s.fundingAprChange).toBeCloseTo(0.01, 9);
    expect(s.avgFundingApr).toBeCloseTo(0.11, 9);
  });

  it("has no change with a single reading", () => {
    const s = summarizeHistory([snap(1, 0.1)]);
    expect(s.count).toBe(1);
    expect(s.fundingAprChange).toBeNull();
  });
});

describe("change detection", () => {
  function snap2(
    ts: number,
    apr: number,
    stance: "supportive" | "caution" | "neutral",
  ): Snapshot {
    return { ts, symbol: "BTC", fundingAprOnNotional: apr, flowStance: stance, latestNetInflowUsd: 1, flowStreakDays: 1 };
  }

  it("flags a funding flip from earning to paying", () => {
    const s = summarizeHistory([snap2(1, 0.05, "supportive"), snap2(2, -0.03, "supportive")]);
    expect(s.fundingFlipped).toBe(true);
    expect(s.changeHeadline).toContain("paying");
  });

  it("flags a flow stance change", () => {
    const s = summarizeHistory([snap2(1, 0.05, "supportive"), snap2(2, 0.05, "caution")]);
    expect(s.stanceChanged).toBe(true);
    expect(s.changeHeadline).toContain("caution");
  });

  it("reports a material funding move with no flip", () => {
    const s = summarizeHistory([snap2(1, 0.1, "supportive"), snap2(2, 0.05, "supportive")]);
    expect(s.fundingFlipped).toBe(false);
    expect(s.changeHeadline).toContain("fell");
  });

  it("returns no headline when nothing material changed", () => {
    const s = summarizeHistory([snap2(1, 0.1, "supportive"), snap2(2, 0.105, "supportive")]);
    expect(s.changeHeadline).toBeNull();
  });
});
