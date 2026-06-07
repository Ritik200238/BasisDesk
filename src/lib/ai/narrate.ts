// Grounded AI narration. The LLM restates figures the deterministic core already computed —
// it never produces a new number, a price prediction, or advice (CLAUDE.md Section 2). Gated
// behind ANTHROPIC_API_KEY: with no key it returns not_configured and the UI shows a connect
// state. Server-side only.

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

export interface NarrationInput {
  vaultName: string;
  symbol: string;
  fundingAprPct: number;
  fundingRateBpsPerHour: number;
  riskState: string;
  riskReasons: string[];
  liquidationDistancePct: number;
  flow: { headline: string; stance: string; latestNetInflowUsdM: number } | null;
}

export type NarrationResult =
  | {
      state: "ok";
      summary: string;
      confidence: "high" | "medium" | "low";
      caveat: string;
      basis: string[];
      asOf: string;
    }
  | { state: "not_configured" }
  | { state: "error"; message: string };

const narrationSchema = z.object({
  summary: z
    .string()
    .describe("1-2 plain-English sentences on the vault's current state, restating ONLY the given numbers"),
  confidence: z.enum(["high", "medium", "low"]),
  caveat: z.string().describe("one short caveat, e.g. that funding can flip negative"),
});

const SYSTEM = [
  "You explain a delta-neutral crypto vault to a non-expert.",
  "Rules you must follow:",
  "- Use ONLY the numbers provided. Never invent, compute, estimate, or round to a new number.",
  "- No price predictions, no buy/sell advice, no guarantees of yield.",
  "- Plain English, concrete, at most two sentences. Name the funding rate and the institutional flow when given.",
  "- If the state is de-risk or flows are in outflow, say so plainly rather than reassure.",
].join("\n");

// Pure: build the grounded prompt from the computed figures. Tested directly.
export function buildNarrationPrompt(input: NarrationInput): string {
  const lines = [
    `Vault: ${input.vaultName} (${input.symbol}).`,
    `Funding APR (annualized, live): ${input.fundingAprPct.toFixed(2)}%.`,
    `Current funding rate: ${input.fundingRateBpsPerHour.toFixed(2)} bps per hour.`,
    `Risk state: ${input.riskState}. Reasons: ${input.riskReasons.join("; ")}.`,
    `Short liquidation room: ${input.liquidationDistancePct.toFixed(1)}%.`,
  ];
  if (input.flow) {
    const sign = input.flow.latestNetInflowUsdM >= 0 ? "+" : "";
    lines.push(
      `Institutional ETF flow (SoSoValue): ${input.flow.headline}, stance ${input.flow.stance}, latest net ${sign}${input.flow.latestNetInflowUsdM.toFixed(0)}M USD.`,
    );
  } else {
    lines.push("Institutional ETF flow: not available (no SoSoValue key set).");
  }
  return lines.join("\n");
}

function buildBasis(input: NarrationInput): string[] {
  const basis = [`SoDEX funding ${input.fundingAprPct.toFixed(2)}% APR`];
  if (input.flow) basis.push(`SoSoValue ${input.flow.headline}`);
  return basis;
}

export async function narrateVault(
  input: NarrationInput,
  now: Date = new Date(),
): Promise<NarrationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return { state: "not_configured" };

  try {
    const anthropic = createAnthropic({ apiKey });
    const modelId = process.env.BASISDESK_AI_MODEL?.trim() || "claude-haiku-4-5-20251001";
    const { object } = await generateObject({
      model: anthropic(modelId),
      schema: narrationSchema,
      system: SYSTEM,
      prompt: buildNarrationPrompt(input),
    });
    return {
      state: "ok",
      summary: object.summary,
      confidence: object.confidence,
      caveat: object.caveat,
      basis: buildBasis(input),
      asOf: now.toISOString(),
    };
  } catch (err) {
    return { state: "error", message: err instanceof Error ? err.message : "AI narration failed" };
  }
}
