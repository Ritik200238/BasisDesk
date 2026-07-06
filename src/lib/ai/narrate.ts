// Grounded AI narration. The LLM restates figures the deterministic core already computed —
// it never produces a new number, a price prediction, or advice (CLAUDE.md Section 2). Gated
// behind NVIDIA_API_KEY: with no key it returns not_configured and the UI shows a connect
// state. Calls NVIDIA's OpenAI-compatible endpoint directly (no SDK dependency); server-side only.
//
// Model is env-configurable via BASISDESK_AI_MODEL. Default is meta/llama-3.1-8b-instruct: on
// NVIDIA's free tier the 70B variants can take 40s+ (they queue), which blows the render budget;
// the 8B model returns the same grounded JSON in a few seconds. If the model is slow or
// unreachable, narrateVault falls back to a deterministic, grounded summary (origin "engine")
// built from the same computed figures, so the panel is never blank at demo time (CLAUDE.md S8).

import { z } from "zod";

export interface NarrationInput {
  vaultName: string;
  symbol: string;
  fundingAprPct: number;
  fundingRateBpsPerHour: number;
  riskState: string;
  riskReasons: string[];
  liquidationDistancePct: number;
  flow: { headline: string; stance: string; conviction: string; latestNetInflowUsdM: number } | null;
}

export type NarrationResult =
  | {
      state: "ok";
      // "model" = the LLM narrated it; "engine" = deterministic grounded fallback (model was
      // slow/unreachable). The UI labels the two differently so it never implies an LLM wrote text.
      origin: "model" | "engine";
      summary: string;
      confidence: "high" | "medium" | "low";
      caveat: string;
      basis: string[];
      asOf: string;
    }
  | { state: "not_configured" };

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

const DEFAULT_MODEL = "meta/llama-3.1-8b-instruct";
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
      `Institutional ETF flow (SoSoValue): ${input.flow.headline}, stance ${input.flow.stance} (${input.flow.conviction} conviction), latest net ${sign}${input.flow.latestNetInflowUsdM.toFixed(0)}M USD.`,
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

// Short timeout on purpose: because narrateVault has a grounded deterministic fallback, failing
// fast to that fallback is better than hanging on a slow model and stalling the whole render.
async function callModel(prompt: string, apiKey: string, model: string, timeoutMs = 12_000): Promise<unknown> {
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

// Cache successful narrations briefly so the live auto-refresh doesn't re-bill the model every
// tick. Keyed by the figures that would actually change the text.
const narrationCache = new Map<string, { at: number; result: NarrationResult }>();
const NARRATION_TTL_MS = 5 * 60_000;

function cacheKey(input: NarrationInput): string {
  return [
    input.symbol,
    input.riskState,
    Math.round(input.fundingAprPct * 10),
    input.flow ? `${input.flow.stance}:${input.flow.headline}` : "noflow",
  ].join("|");
}

// Grounded, deterministic narration built ONLY from figures the engine already computed — no
// model, no new numbers, no prediction. Served when NVIDIA is slow/unreachable so the panel is
// never blank at demo time. Labeled origin "engine" so the UI never implies an LLM wrote it.
function buildDeterministicNarration(input: NarrationInput, now: Date): NarrationResult {
  const earns = input.fundingAprPct >= 0;
  const sentences = [
    `At ${input.fundingRateBpsPerHour.toFixed(2)} bps/hr funding, the short ${earns ? "earns" : "pays"} an annualized ${Math.abs(input.fundingAprPct).toFixed(2)}% while the hedge holds price exposure near zero.`,
  ];
  if (input.flow) {
    const sign = input.flow.latestNetInflowUsdM >= 0 ? "+" : "";
    sentences.push(
      `Institutional ETF flow is ${input.flow.stance} (${input.flow.conviction} conviction, latest ${sign}${input.flow.latestNetInflowUsdM.toFixed(0)}M): ${input.flow.headline}.`,
    );
  }
  const caveat =
    input.riskState === "derisk"
      ? "De-risk: funding or flows have turned against the position."
      : input.riskState === "watch"
        ? `Watch: ${input.liquidationDistancePct.toFixed(0)}% liquidation room; funding can turn negative.`
        : `Funding resets hourly and can turn negative; ${input.liquidationDistancePct.toFixed(0)}% liquidation room.`;
  const confidence: "high" | "medium" | "low" =
    input.riskState === "derisk" ? "low" : input.riskState === "watch" ? "medium" : "high";
  return {
    state: "ok",
    origin: "engine",
    summary: sentences.join(" "),
    confidence,
    caveat,
    basis: buildBasis(input),
    asOf: now.toISOString(),
  };
}

export async function narrateVault(
  input: NarrationInput,
  now: Date = new Date(),
): Promise<NarrationResult> {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return { state: "not_configured" };

  const key = cacheKey(input);
  const cached = narrationCache.get(key);
  if (cached && now.getTime() - cached.at < NARRATION_TTL_MS) return cached.result;

  const model = process.env.BASISDESK_AI_MODEL?.trim() || DEFAULT_MODEL;
  const prompt = buildNarrationPrompt(input);

  // One attempt. If the model returns valid JSON we narrate it (origin "model"); if it is slow,
  // errors, or returns a bad shape we serve the deterministic grounded fallback (origin "engine").
  // Either way the panel renders real, grounded text — never a "unavailable" dead end.
  let result: NarrationResult;
  try {
    const raw = await callModel(prompt, apiKey, model);
    const parsed = narrationSchema.safeParse(raw);
    if (parsed.success) {
      result = {
        state: "ok",
        origin: "model",
        summary: parsed.data.summary,
        confidence: parsed.data.confidence,
        caveat: parsed.data.caveat,
        basis: buildBasis(input),
        asOf: now.toISOString(),
      };
    } else {
      console.error(`[narrate-fallback] model returned an unexpected shape :: ${model}`);
      result = buildDeterministicNarration(input, now);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error(`[narrate-fallback] ${msg} :: ${model}`);
    result = buildDeterministicNarration(input, now);
  }
  narrationCache.set(key, { at: now.getTime(), result });
  return result;
}
