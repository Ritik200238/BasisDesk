// Sliding-window limiter shared across SoSoValue calls in a server instance. SoSoValue's
// default budget is ~20 req/min per key; tripping it blanks data, so we self-throttle.
// Per-instance only (serverless instances do not share state), which is sufficient here.
export class SlidingWindowLimiter {
  private hits: number[] = [];

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.limit) {
      const waitMs = this.windowMs - (now - this.hits[0]) + 5;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.acquire();
    }
    this.hits.push(Date.now());
  }
}
