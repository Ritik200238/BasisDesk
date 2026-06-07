// SoSoValue OpenAPI configuration. The API key is required and read from the environment;
// it is never bundled to the client. Base URL and rate limit are env-overridable.
// Docs: https://sosovalue-1.gitbook.io/sosovalue-api-doc

const DEFAULT_BASE = "https://openapi.sosovalue.com/openapi/v1";

export function getBaseUrl(): string {
  return (process.env.SOSOVALUE_API_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

export function getApiKey(): string {
  return process.env.SOSOVALUE_API_KEY?.trim() ?? "";
}

// When false, the client returns a typed "not_configured" result without making a request,
// so the UI shows an explicit connect-key state (never fabricated data).
export function isConfigured(): boolean {
  return getApiKey().length > 0;
}

// Default 20 req/min per the docs; overridable for a higher Buildathon tier.
export function getRateLimitPerMin(): number {
  const raw = Number(process.env.SOSOVALUE_RATE_LIMIT_PER_MIN);
  return Number.isFinite(raw) && raw > 0 ? raw : 20;
}

export const AUTH_HEADER = "x-soso-api-key";

export function ssvUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const url = new URL(`${getBaseUrl()}/${path.replace(/^\/+/, "")}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}
