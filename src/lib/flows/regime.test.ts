import { describe, it, expect } from "vitest";
import { computeFlowRegime, escalateForFlow, escalateForRegime } from "./regime";
import type { EtfSummaryRecord } from "@/lib/sosovalue";

function rec(date: string, inflow: number): EtfSummaryRecord {
  return { date, total_net_inflow: inflow, total_net_assets: 60_000_000_000, cum_net_inflow: 13_000_000_000 };
}

describe("computeFlowRegime", () => {
  it("counts a consecutive inflow streak and is supportive", () => {
    const r = computeFlowRegime("BTC", [
      rec("2026-06-01", 100),
      rec("2026-06-02", 200),
      rec("2026-06-03", 150),
    ])!;
    expect(r.direction).toBe("inflow");
    expect(r.streakDays).toBe(3);
    expect(r.stance).toBe("supportive");
    expect(r.flippedToday).toBe(false);
  });

  it("detects a flip to outflow today and flags caution", () => {
    const r = computeFlowRegime("BTC", [
      rec("2026-06-01", 100),
      rec("2026-06-02", 200),
      rec("2026-06-03", -120),
    ])!;
    expect(r.direction).toBe("outflow");
    expect(r.streakDays).toBe(1);
    expect(r.flippedToday).toBe(true);
    expect(r.stance).toBe("caution");
  });

  it("handles unsorted input by date", () => {
    const r = computeFlowRegime("ETH", [
      rec("2026-06-03", -50),
      rec("2026-06-01", 10),
      rec("2026-06-02", -20),
    ])!;
    // latest is 06-03 (-50), prior 06-02 (-20): both outflow -> streak 2
    expect(r.latestDate).toBe("2026-06-03");
    expect(r.streakDays).toBe(2);
    expect(r.stance).toBe("caution");
  });

  it("returns null on empty input", () => {
    expect(computeFlowRegime("BTC", [])).toBeNull();
  });
});

describe("composite flow brain", () => {
  const outflows = [
    rec("2026-06-01", -300),
    rec("2026-06-02", -250),
    rec("2026-06-03", -400),
    rec("2026-06-04", -350),
    rec("2026-06-05", -500),
  ];
  const inflows = outflows.map((r) => ({ ...r, total_net_inflow: -r.total_net_inflow }));

  it("a sustained outflow streak yields negative conviction and shrinks the suggested size", () => {
    const r = computeFlowRegime("BTC", outflows)!;
    expect(r.compositeScore).toBeLessThan(-0.4);
    expect(r.conviction).toBe("high");
    expect(r.sizeMultiplier).toBeLessThan(1);
    expect(r.sizeMultiplier).toBeGreaterThanOrEqual(0.5);
  });

  it("a sustained inflow streak keeps full size", () => {
    const r = computeFlowRegime("BTC", inflows)!;
    expect(r.compositeScore).toBeGreaterThan(0.4);
    expect(r.sizeMultiplier).toBe(1);
  });

  it("escalateForRegime pushes a high-conviction outflow straight to de-risk", () => {
    expect(escalateForRegime("calm", computeFlowRegime("BTC", outflows)!)).toBe("derisk");
    expect(escalateForRegime("calm", computeFlowRegime("BTC", inflows)!)).toBe("calm");
  });
});

describe("escalateForFlow", () => {
  it("raises calm to watch on caution", () => {
    expect(escalateForFlow("calm", "caution")).toBe("watch");
  });
  it("keeps derisk on caution", () => {
    expect(escalateForFlow("derisk", "caution")).toBe("derisk");
  });
  it("leaves risk unchanged when supportive", () => {
    expect(escalateForFlow("calm", "supportive")).toBe("calm");
  });
});
