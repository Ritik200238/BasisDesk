// Grounded AI narration. The LLM restates figures the deterministic core already computed —
// it never produces a new number, a price prediction, or advice (CLAUDE.md Section 2). Gated
// behind NVIDIA_API_KEY: with no key it returns not_configured and the UI shows a connect
// state. Calls NVIDIA's OpenAI-compatible endpoint directly (no SDK dependency); server-side only.
//
// Model is env-configurable via BASISDESK_AI_MODEL. Default is meta/llama-3.3-70b-instruct, which
// returns clean grounded JSON on NVIDIA. (moonshotai/kimi-k2.6 was tested and currently returns
// malformed/hallucinated output on NVIDIA's serving — switch to it via the env var once fixed.)

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
  summary: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  caveat: z.string().min(1),
});

const SYSTEM = [
  "You explain a delta-neutral crypto vault to a non-expert.",
  "Output ONLY a JSON object with keys: summary, confidence, caveat.",
  "- summary: 1-2 plain-English sentences using ONLY the numbers given; name the funding rate and the ETF flow. Never invent, compute, or round to a new number.",
  "- confidence: one of high, medium, low.",
  "- caveat: one short risk note, at most 14 words.",
  "No price predictions, no buy/sell advice, no generic filler. If the risk is de-risk or flows are in outflow, say so plainly rather than reassure.",
].join("\n");

const DEFAULT_MODEL = "meta/llama-3.3-70b-instruct";
const DEFAULT_BASE = "https://integrate.api.nvidia.com/v1";

// Pure: build the grounded prompt from the computed figures. Tested directly.
export function buildNarrationPrompt(input: NarrationInput): string {
  const lines = [
    `Vault: ${input.vaultName} (${input.symbol}).`,
    `Funding APR (annualized, live): ${input.fundingAprPct.toFixed(2)}% (${input.fundingAprPct >= 0 ? "the short earns" : "the short pays"}).`,
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
    lines.push("Institutional ETF flow: not available for this market.");
  }
  return lines.join("\n");
}

function buildBasis(input: NarrationInput): string[] {
  const basis = [`SoDEX funding ${input.fundingAprPct.toFixed(2)}% APR`];
  if (input.flow) basis.push(`SoSoValue ${input.flow.headline}`);
  return basis;
}

async function callModel(prompt: string, apiKey: string, model: string, timeoutMs = 15_000): Promise<unknown> {
  const base = process.env.NVIDIA_API_BASE?.trim() || DEFAULT_BASE;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 320,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`NVIDIA returned ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("no message content");
    return JSON.parse(content);
  } finally {
    clearTimeout(timer);
  }
}

export async function narrateVault(
  input: NarrationInput,
  now: Date = new Date(),
): Promise<NarrationResult> {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return { state: "not_configured" };

  const model = process.env.BASISDESK_AI_MODEL?.trim() || DEFAULT_MODEL;
  const prompt = buildNarrationPrompt(input);

  let lastMessage = "AI narration unavailable";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callModel(prompt, apiKey, model);
      const parsed = narrationSchema.safeParse(raw);
      if (parsed.success) {
        return {
          state: "ok",
          summary: parsed.data.summary,
          confidence: parsed.data.confidence,
          caveat: parsed.data.caveat,
          basis: buildBasis(input),
          asOf: now.toISOString(),
        };
      }
      lastMessage = "AI returned an unexpected shape";
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : "AI narration failed";
    }
  }
  return { state: "error", message: lastMessage };
}
