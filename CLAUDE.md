@AGENTS.md

# CLAUDE.md — BasisDesk Operating Constitution

This governs every action while building BasisDesk. Read Section 0 at the start of each work session. These rules are enforced, not decorative. This document follows its own anti-slop rules: no emojis, no filler, concrete checks only.

BasisDesk in one line: an on-chain, delta-neutral yield vault — hold a SoSoValue-defined basket long, short the matching SoDEX perpetual to cancel price risk, and harvest the funding rate as real yield. SoSoValue is the brain; SoDEX is the hands.

Framework note: this repo runs Next.js 16 / React 19 / Tailwind 4, which are newer than the assistant's training data. Before writing framework-specific code, consult `@AGENTS.md` and `node_modules/next/dist/docs/`. Do not assume older Next.js conventions.

---

## 0. Prime Directives (the six non-negotiables)

1. **SoSoValue is the load-bearing wall.** Per feature ask: "if I delete every SoSoValue call, does this still have a reason to exist?" If yes, route it through SoSoValue or cut it. Disconnecting the SoSoValue key must break core surfaces loudly (empty/error state) — never a silent mock fallback.
2. **Real data or stop.** No mock, stub, hardcoded, random, or silently-stale financial value in any path a user can reach. Every number traces to a live API/on-chain read made at runtime. If an upstream is down, render an explicit "data unavailable — as of <ts>" state and surface the blocker. Never substitute placeholder data, `Math.random`, or a TODO-real-later.
3. **Default to NOT building.** Before coding any feature, state in one sentence: which user, which decision it improves, what they do next. Can't write it? Stop. Build the one wedge (deposit -> delta-neutral position -> live funding yield -> redeem) deep before any breadth.
4. **Every AI output shows its work.** Each AI sentence ships with the SoSoValue datapoint(s) + timestamp it used and a confidence/caveat. ALL numeric/financial math (PnL, delta, APY, funding, slippage, sizing) is computed in deterministic, unit-tested code — never inside the LLM. No price predictions, no "buy now", no guaranteed returns. A confident wrong answer is a P0 bug equal to a crash.
5. **Non-custodial and risk-gated by construction.** Never take, store, log, or transmit private keys or seed phrases. All signing is client-side via the user's wallet. Every fund-moving path requires an explicit human-confirm step restating action, asset, size, est. price/slippage/fees, and worst-case downside before signing. Never auto-execute. Default SoDEX to testnet; mainnet only behind an unmistakable real-funds banner.
6. **Done = demoable end-to-end, verified by running it.** A task is done only when it runs against real APIs with every failure path handled (loading/empty/error/rate-limited/stale), is reachable from the real UI, and you actually ran it (clicked it / pasted the observed output). "Compiles" and "looks done" are not done. `main` is always demoable; a broken happy path is the new P0.

---

## 1. Data & API Integration

- Never invent endpoints, fields, params, auth, or rate limits. Read the doc (or hit the endpoint once and log the real shape) before coding against it. Record the doc URL beside each endpoint. Ambiguous/unreachable doc = stop and surface, do not scaffold against a guess.
- Treat every external call as hostile. One typed client per provider with: timeout, retry-with-backoff on 5xx/transient, explicit 401/403/429 handling surfaced to the user, and zod response-schema validation so changed/malformed responses fail loud, not silent.
- Respect rate budgets. Shared rate limiter, request de-dup, short server-side cache with a visible "as of <ts>" staleness label. Read rate-limit headers; honor `retry_after`/429. Never fan out unbounded per-render calls.
- Maintain `docs/CLAIMS.md` (data-lineage ledger): every user-facing output maps to the exact endpoint + code path that backs it. A claim with no backing row is removed from the UI. Updating it is part of finishing a feature.

## 2. AI Behavior & Anti-Slop Intelligence

- Provenance or it does not ship: every AI output renders with its source datapoint + timestamp, one or two specific sentences of reasoning, and a confidence/caveat. No citation, no claim.
- Compute every financial value in deterministic code; pass verified numbers to the LLM only for narration. Constrain LLM outputs to JSON schemas, validate, retry on violation.
- Calibrated humility: emit "not enough signal" rather than fabricate. Never state or imply price targets or directional guarantees. Apply the test: "could this sentence have been written without fetching any data?" If yes, it is slop — rewrite to cite a real value or suppress it.

## 3. Security, Funds & Risk

- Strictly non-custodial: backend sees only public addresses and signed txs/intents. Never build a "paste your private key" field.
- Secrets only from env/secrets manager — never committed, logged, echoed to chat/README/errors. `.gitignore` `.env*` from commit 1; ship `.env.example` with empty values.
- Every execution path (SoDEX order, vault rebalance, redeem) passes a mandatory pre-trade confirmation showing exact action, instrument, size, est. price/slippage, fees, network, and worst-case downside, with cancel. No auto-execute. Approve exact amounts (no unbounded approvals); support revoke.
- Money math is provably right: integer/decimal-safe arithmetic (no float for token amounts/prices), handle each token's real decimals, and cross-check every computed figure against the protocol's returned value or an independent recompute in a test before it renders. Delta must be reported honestly; a vault claiming "neutral" must prove |net delta| within tolerance.

## 4. Product, PMF & Prioritization

- Pin the ONE user + ONE job at the top of the README and re-read before each feature. Build the wedge world-class before any second top-level feature.
- Build a reason to return: surface what changed since last visit (funding earned, delta drift, risk-state change, institutional-flow shift). A stateless one-shot tool is forbidden as the core.
- Prioritize by judging-weighted impact, one vertical slice at a time. A live clickable path (Value 30% + Demo 25%) outranks a new half-wired feature. Never start feature B while feature A is half-wired.
- Maintain a SCOPE ledger (`docs/SCOPE.md`): Building Now / Explicitly Cut (one-line reason) / Later. Default answer to a new feature is "backlog it."

## 5. UX & Craft

- New feature vs. polish an existing flow -> polish. UX is concrete: no dead clicks, feedback within ~300ms on every state, plain-language labels, first-time user reaches core value in under 60s with zero narration.
- Design five states before the happy path for every data surface: loading (skeleton), empty (with next action), error (specific cause + recovery, never "Something went wrong"), partial/stale, populated. Not done until all five exist.
- Every money/risk number carries inline context: unit, timeframe, provenance — "+2.4% (24h)" not "+2.4%", "APY 14.2% (7d funding avg)" not "14.2%". One central formatting module owns price/%/bps/K-M-B/negative/null; no component formats numbers itself. A bare number in a finance UI is a bug.
- Design tokens first, one file: max 5 type sizes, 4/8px spacing only, constrained palette (1 brand + neutrals + semantic up/down/warn), 2 fonts max. Components consume tokens; raw hex and one-off pixels are forbidden. Never convey gain/loss by color alone (add sign/arrow/label).

## 6. Anti-Slop Surface Tells

- Banned lexicon in all user-facing text, README, commits, UI: seamless, effortless, unlock, unleash, empower, revolutionize, game-changing, cutting-edge, leverage, robust, comprehensive, elevate, supercharge, one-stop, delve, "in today's fast-paced world", "whether you're X or Y", "the power of", "it's not just X, it's Y", rhetorical-question openers. Name the actual index, endpoint, number. If a sentence would survive being pasted into any other product's README, delete it.
- Zero emojis in README body, code comments, commit messages, UI labels. No "Powered by AI" badges. One consistent product voice: terse, numeric, addresses the user as a peer.
- No feature appears in README/UI/demo before its code runs end-to-end on real data. Forbidden: "coming soon", disabled buttons with tooltips, dropdown options that 404, charts seeded with random/lorem data, hardcoded sample responses dressed as live.
- Delete all boilerplate: starter content, placeholder favicons, lorem, unused generated files, commented-out code. Components named for domain concepts (VaultDeltaPanel, FundingYieldCard), never Component1. Comments explain WHY, never restate the next line.

## 7. Pre-Commit & Pre-Demo Gates

- Adversarial self-audit before every commit: grep the diff for TODO/FIXME/mock/fake/dummy/placeholder/sample/lorem/Math.random and hardcoded price/balance numbers; re-read changed user-facing text against the banned lexicon + emoji rules; click every changed UI control to confirm it hits real data. Anything fires = fix before committing.
- Demo-failure budget: before a feature is done, simulate the three demo-killers — API empty, API slow/timeout, 429 — and confirm the UI degrades gracefully (last-known value with visible "as of", clear error, no infinite spinner).
- Reverse-judge review before any submission: score against the five weights (30/25/20/15/10), name the single weakest score and the one change that moves it most, do that first. Verify UI by rendering at real breakpoints with live data (screenshot, check overflow/alignment/contrast).
- Commit in small logical working increments with clear messages, no bundled unrelated changes. README reflects a funded startup as a pre-submission checklist item (clean-clone setup steps, accurate feature list with no aspirational features, architecture diagram, data-lineage notes) — never burn cycles on badges while flows are broken.

## 8. Compliance, Wallet & Demo-Resilience

- Prominent "not financial advice; not available in restricted jurisdictions" posture. Treat displayed third-party data per its API terms.
- Wallet handling: explicit connect flow, wrong-network detection + one-click switch, account-switch handling, and a clear state when no wallet is connected. Deliver read-only value BEFORE wallet connection (the cold-stranger first run must show real insight without signing).
- Market-hours honesty: ETF flows are business-day/T+1; crypto and funding are 24/7. Label "as-of" semantics explicitly; never blend the two silently.
- Demo resilience: live calls can fail at judging time. Sanctioned fallback is a clearly-labeled replay of a previously-captured REAL run (never fabricated data) plus a visible status indicator — the "everything real" rule still holds.

---

## Appendix A: Definition of Done (single gate)

A feature is done when ALL hold:
- [ ] Runs against the real API/chain; no mock or hardcoded financial value in the path.
- [ ] All five UI states exist (loading/empty/error/stale/populated).
- [ ] Survives the three demo-killers (empty/slow/429) gracefully.
- [ ] Every number is deterministically computed + unit-tested, carries unit/timeframe/provenance, and is cross-checked against an independent source/recompute.
- [ ] Any fund-moving action is behind explicit confirmation; non-custodial; testnet-gated.
- [ ] Reachable from the real product UI; you ran it and observed the output.
- [ ] `docs/CLAIMS.md` updated for any new user-facing claim.
- [ ] Diff passes the Section 7 self-audit grep + banned-lexicon/emoji check.

## Appendix B: Verified Project Facts (do not re-guess)

Product wedge (the one loop): connect wallet -> pick a vault (e.g. BTC Market-Neutral) -> see honest pre-deposit pitch (APY, delta, worst-case, yield source) -> deposit -> live dashboard (value, delta ~ 0, funding earned, risk state) -> redeem. Read-only insight (flows, funding, risk) available before connecting.

SoDEX API (verified from official .md docs, high confidence):
- Perps: REST `https://{mainnet,testnet}-gw.sodex.dev/api/v1/perps`; WS `wss://.../ws/perps`. Spot under `/api/v1/spot`.
- Auth: master wallet -> revocable API keys (<=5). EIP-712 signed; headers `X-API-Key`, `X-API-Sign`, `X-API-Nonce`. Perps EIP-712 domain `name="futures"`, testnet `chainId=138565`.
- Funding (our yield source): current via `GET /markets/mark-prices` + WS `mark-price` (`r`=fundingRate, `T`=nextFundingTime); historical via `GET /accounts/{addr}/fundings` (`fundingFee`). Funding hourly, cap 4%/hr.
- Positions (read): `GET /accounts/{addr}/positions` + WS `WsPerpsPosition`: `sz` size, `ep` entry, `ur` unrealized PnL, `lp` liquidation price, `l` leverage, `m` margin mode.
- Spot account (read, public, no signing): `GET /accounts/{addr}/balances`, `GET /accounts/{addr}/state`.
- Markets/symbols: format `BTC-USD` (not vBTC). Known underlyings: BTC, ETH, SOL, DOGE, LINK, XAUT (gold), SILVER. Enumerate live via `GET /markets/symbols`.
- Order types: Limit (GTC/IOC/GTX=post-only), Market (IOC), Stop Market, Stop Limit (`stopPrice`,`stopType`), `reduceOnly`, TP/SL via `modifier=BRACKET`/`ATTACHED_STOP`.
- Rate limits: 1200 weight/min/IP; API-key orders 600/min & 20/sec; WS 10 conns/IP, 2000 msgs/min.
- ACCESS BLOCKER: testnet is whitelist-gated (apply via Buildathon form; ~1 week). Public read endpoints (balances/state/market-data/mark-prices) work without whitelist. The signed write-path (orders) needs a whitelisted wallet. Build read-only + market-data first; gate the write-path behind a flag.
- Docs: https://sodex.com/documentation/trading-api/trading-api.md and sub-pages (rest-v1, websocket-v1, go-sdk-signing-guide, api-rate-limits).

SoSoValue API (medium confidence on exact field schemas — VERIFY against live docs + a real key before relying on shapes; some doc pages were JS-rendered/404 during research):
- Docs: https://sosovalue-1.gitbook.io/sosovalue-api-doc (and sosovalue.gitbook.io/soso-value-api-doc). Likely base `https://openapi.sosovalue.com/openapi/v1`, header `x-soso-api-key`, ~20 req/min, ~100k/month — TREAT AS UNCONFIRMED until verified live. Make base URL + limits env-configurable.
- Data modules to use: crypto spot-ETF flows (BTC/ETH per-issuer net flow, AUM, cumulative), prices/indicators, structured news (`matched_currencies` filter) for the grounded "why", and SSI index data/methodology for the basket. Confirm exact endpoints/fields from docs before coding each.

SSI Protocol (verified from Solidity source, med-high confidence):
- Repo: https://github.com/SoSoValueLabs/ssi-protocol (Foundry/Solidity). Contracts: AssetIssuer, AssetFactory, AssetToken, AssetRebalancer, AssetLocking, USSI, Interface.sol. Chain corroborated as Base. Public REST API not found — read on-chain. Confirm deployed addresses before integrating.

Stack decision (default, defensible for this product): Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; wagmi + viem for wallet + EIP-712 signing; deterministic finance core as a standalone, fully unit-tested TS module; zod for all external-response validation; dnum for decimal-safe token math; persistence for accumulating funding/flow history. Deploy on Vercel. Keep the deterministic core free of any framework/network dependency so it is trivially testable.
