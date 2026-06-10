import { describe, it, expect } from "vitest";
import { buildNarrationPrompt, narrateVault, type NarrationInput } from "./narrate";

const input: NarrationInput = {
  vaultName: "BTC Market-Neutral",
  symbol: "BTC-USD",
  fundingAprPct: 10.95,
  fundingRateBpsPerHour: 0.125,
  riskState: "calm",
  riskReasons: ["delta within tolerance, ample liquidation headroom, funding positive"],
  liquidationDistancePct: 31.3,
  flow: { headline: "Day 3 inflow streak", stance: "supportive", latestNetInflowUsdM: 211 },
};

describe("buildNarrationPrompt", () => {
  it("grounds the prompt in the provided figures only", () => {
    const p = buildNarrationPrompt(input);
    expect(p).toContain("BTC-USD");
    expect(p).toContain("10.95%");
    expect(p).toContain("0.13 bps per hour"); // 0.125 -> toFixed(2)
    expect(p).toContain("Day 3 inflow streak");
    expect(p).toContain("+211M");
  });

  it("notes when SoSoValue flow is unavailable", () => {
    const p = buildNarrationPrompt({ ...input, flow: null });
    expect(p).toContain("not available");
  });
});

describe("narrateVault gating", () => {
  it("returns not_configured when NVIDIA_API_KEY is unset", async () => {
    const prev = process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    const r = await narrateVault(input);
    expect(r.state).toBe("not_configured");
    if (prev !== undefined) process.env.NVIDIA_API_KEY = prev;
  });
});
