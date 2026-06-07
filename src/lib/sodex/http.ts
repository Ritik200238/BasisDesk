// Typed fetch wrapper for SoDEX public REST endpoints. Adds timeout, retry-with-backoff on
// transient failures, explicit 401/403/429 handling, and zod validation of the standard
// { code, msg, data } envelope. Returns a discriminated Result so callers render real error
// states instead of throwing (CLAUDE.md Section 1). Server-side use only.

import { z } from "zod";

export type SodexErrorKind =
  | "network"
  | "timeout"
  | "rate_limited"
  | "unauthorized"
  | "upstream"
  | "schema";

export interface SodexError {
  kind: SodexErrorKind;
  message: string;
  status?: number;
  retryAfterMs?: number;
}

export type SodexResult<T> =
  | { ok: true; data: T; asOf: Date }
  | { ok: false; error: SodexError };

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

function backoffMs(attempt: number): number {
  return Math.min(250 * 2 ** (attempt - 1), 2_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

// The SoDEX REST envelope: code 0 means success.
function sodexEnvelope<T extends z.ZodTypeAny>(data: T) {
  return z.object({ code: z.number(), msg: z.string().optional(), data });
}

export async function getJson<T>(
  url: string,
  dataSchema: z.ZodType<T>,
  opts: { timeoutMs?: number; now?: Date } = {},
): Promise<SodexResult<T>> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const envelope = sodexEnvelope(dataSchema);
  let lastError: SodexError = { kind: "network", message: "request not attempted" };

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      clearTimeout(timer);

      if (res.status === 429) {
        const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
        lastError = {
          kind: "rate_limited",
          message: "SoDEX rate limit hit (429)",
          status: 429,
          retryAfterMs,
        };
        if (attempt <= MAX_RETRIES) {
          await sleep(retryAfterMs ?? backoffMs(attempt));
          continue;
        }
        return { ok: false, error: lastError };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: {
            kind: "unauthorized",
            message: `SoDEX rejected the request (${res.status})`,
            status: res.status,
          },
        };
      }
      if (res.status >= 500) {
        lastError = { kind: "upstream", message: `SoDEX server error (${res.status})`, status: res.status };
        if (attempt <= MAX_RETRIES) {
          await sleep(backoffMs(attempt));
          continue;
        }
        return { ok: false, error: lastError };
      }
      if (!res.ok) {
        return {
          ok: false,
          error: { kind: "upstream", message: `SoDEX returned ${res.status}`, status: res.status },
        };
      }

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return { ok: false, error: { kind: "schema", message: "SoDEX response was not valid JSON" } };
      }

      const parsed = envelope.safeParse(json);
      if (!parsed.success) {
        return {
          ok: false,
          error: { kind: "schema", message: `Unexpected SoDEX response shape: ${parsed.error.message}` },
        };
      }
      if (parsed.data.code !== 0) {
        return {
          ok: false,
          error: {
            kind: "upstream",
            message: `SoDEX error code ${parsed.data.code}: ${parsed.data.msg ?? ""}`.trim(),
          },
        };
      }
      return { ok: true, data: parsed.data.data as T, asOf: opts.now ?? new Date() };
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = isAbort
        ? { kind: "timeout", message: `SoDEX request timed out after ${timeoutMs}ms` }
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
