// Minimal class-name joiner. Filters falsy values so conditional classes read cleanly.
// Intentionally dependency-free; we do not need clsx/tailwind-merge for this surface.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
