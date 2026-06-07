// Typed fetch wrapper for the SoSoValue OpenAPI. Short-circuits to a typed "not_configured"
// result when no key is set (so the UI renders a connect-key state, never mock data),
// self-throttles to the rate budget, retries transient failures, and validates responses
// with zod. SoSoValue may wrap payloads in { code, data, msg } or return them directly, so
// the parser unwraps a `data` envelope when present. Server-side only.

import { z } from "zod";
import { AUTH_HEADER, getApiKey, getRateLimitPerMin, isConfigured } from "./config";
import { SlidingWindowLimiter } from "./ratelimit";

export type SsvErrorKind =
  | "not_configured"
  | "network"
  | "timeout"
  | "rate_limited"
  | "unauthorized"
  | "upstream"
  | "schema";

export interface SsvError {
  kind: SsvErrorKind;
  message: string;
  status?: number;
  retryAfterMs?: number;
}

export type SsvResult<T> =
  | { ok: true; data: T; asOf: Date }
  | { ok: false; error: SsvError };

const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

let limiter: SlidingWindowLimiter | null = null;
function getLimiter(): SlidingWindowLimiter {
  if (!limiter) limiter = new SlidingWindowLimiter(getRateLimitPerMin());
  return limiter;
}

function backoffMs(attempt: number): number {
  return Math.min(400 * 2 ** (attempt - 1), 3_000);
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

export async function getJson<T>(
  url: string,
  dataSchema: z.ZodType<T>,
  opts: { timeoutMs?: number; now?: Date } = {},
): Promise<SsvResult<T>> {
  if (!isConfigured()) {
    return {
      ok: false,
      error: { kind: "not_configured", message: "SoSoValue API key is not configured." },
    };
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: SsvError = { kind: "network", message: "request not attempted" };

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    await getLimiter().acquire();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json", [AUTH_HEADER]: getApiKey() },
        cache: "no-store",
      });
      clearTimeout(timer);

      if (res.status === 429) {
        const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
        lastError = { kind: "rate_limited", message: "SoSoValue rate limit hit (429)", status: 429, retryAfterMs };
        if (attempt <= MAX_RETRIES) {
          await sleep(retryAfterMs ?? backoffMs(attempt));
          continue;
        }
        return { ok: false, error: lastError };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: { kind: "unauthorized", message: `SoSoValue rejected the key (${res.status})`, status: res.status },
        };
      }
      if (res.status >= 500) {
        lastError = { kind: "upstream", message: `SoSoValue server error (${res.status})`, status: res.status };
        if (attempt <= MAX_RETRIES) {
          await sleep(backoffMs(attempt));
          continue;
        }
        return { ok: false, error: lastError };
      }
      if (!res.ok) {
        return { ok: false, error: { kind: "upstream", message: `SoSoValue returned ${res.status}`, status: res.status } };
      }

      let raw: unknown;
      try {
        raw = await res.json();
      } catch {
        return { ok: false, error: { kind: "schema", message: "SoSoValue response was not valid JSON" } };
      }

      // Unwrap a { code, data, msg } envelope when present; surface non-zero codes.
      let payload: unknown = raw;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const obj = raw as Record<string, unknown>;
        if (typeof obj.code === "number" && obj.code !== 0) {
          return {
            ok: false,
            error: { kind: "upstream", message: `SoSoValue code ${obj.code}: ${String(obj.msg ?? "")}`.trim() },
          };
        }
        if ("data" in obj) payload = obj.data;
      }

      const parsed = dataSchema.safeParse(payload);
      if (!parsed.success) {
        return { ok: false, error: { kind: "schema", message: `Unexpected SoSoValue response shape: ${parsed.error.message}` } };
      }
      return { ok: true, data: parsed.data, asOf: opts.now ?? new Date() };
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = isAbort
        ? { kind: "timeout", message: `SoSoValue request timed out after ${timeoutMs}ms` }
        : { kind: "network", message: err instanceof Error ? err.message : "network error" };
      if (attempt <= MAX_RETRIES) {
        await sleep(backoffMs(attempt));
        continue;
      }
      return { ok: false, error: lastError };
    }
  }
  return { ok: false, error: lastError };
}
