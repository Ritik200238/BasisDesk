// Best-effort in-memory sliding-window rate limiter. On serverless this is per-instance (Fluid
// Compute reuses instances, so it still dampens bursts); for hard guarantees pair it with
// platform-level protection (Vercel Firewall / BotID) or a shared store. Keyed by any string.

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const arr = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (arr.length >= limit) {
    hits.set(key, arr);
    return { ok: false, retryAfterMs: Math.max(0, arr[0] + windowMs - now) };
  }

  arr.push(now);
  hits.set(key, arr);

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      const live = v.filter((t) => t > cutoff);
      if (live.length === 0) hits.delete(k);
      else hits.set(k, live);
    }
  }
  return { ok: true, retryAfterMs: 0 };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
