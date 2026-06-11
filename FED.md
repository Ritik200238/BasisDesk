# FED.md — BasisDesk Frontend Engineering Spec

Everything the frontend engineer needs to (re)design the BasisDesk UI without guessing. You own
the visual language (color, type personality, spacing rhythm, motion, layout). This document fixes
only what must be honored: the pages, the data each surface receives, every state, the copy/trust
rules, and the formatting contract. Nothing here is decorative — if a thing is listed, it must
appear somewhere in your design.

Live reference: https://basisdesk.vercel.app · Repo: https://github.com/Ritik200238/BasisDesk

---

## 1. What BasisDesk is (so the UI says the right thing)

BasisDesk runs **delta-neutral basis trades**. For one market it holds the asset spot and shorts
the matching SoDEX perpetual in equal size, so price exposure nets to ~zero. The yield is the
**funding rate** the short collects each hour. **SoSoValue** institutional ETF-flow data is the
"brain": it decides when to de-risk and how much to size. Execution is non-custodial (the user's
wallet signs) on a testnet sandbox.

- **One user, one job:** a crypto holder who wants a steady, hedged return on an asset without
  day-trading and without the price risk of just holding.
- **The core loop:** look at the board → open a vault → see the honest pre-deposit picture
  (funding, delta ~0, worst case, liquidation) → review a risk receipt → sign → manage/close.
- **Read-only first:** the board, charts, funding, and flow signal must deliver value **before**
  any wallet connection.

### What you own vs. what is fixed
- **You own:** colors, fonts, spacing scale, component shapes, motion, iconography, layout
  composition, responsive breakpoints, empty/loading visual treatments.
- **Fixed (do not drop):** every page and section listed in §6, every data field in §9, the five
  states per surface (§11), provenance on every number (§3), the formatting contract (§5), the
  copy/voice rules (§13), the disclaimers (§13), and the non-custodial confirmation step (§10).

---

## 2. Hard product/design principles (non-negotiable)

1. **Provenance on every number.** Every figure shows its source + freshness. The current UI wraps
   figures in a `ValueWithProvenance` primitive (a small colored "freshness dot" + a hover
   tooltip: `Source: <api> — as of <UTC ts> (<freshness>)`). Keep an equivalent: no number
   appears without an attributable source and time.
2. **Real data or an explicit state — never a fake value.** If an upstream is missing/failing/not
   keyed, render a labeled state (loading / empty / error / not-configured), never a zero or a
   placeholder. A zero is a real measurement; absence renders as a dash ("—").
3. **Five states per data surface** (loading, empty, error, partial/stale, populated). See §11.
4. **Every money/risk number carries unit + timeframe + provenance** inline — "+2.4% (24h)", not
   "2.4%"; "APR 14.2% (funding, live)", not "14.2%".
5. **Color is never the only signal.** Up/down/warn must also carry a sign, arrow, or label
   (accessibility + honesty).
6. **Non-custodial confirmation is mandatory.** Every fund-moving action passes a pre-trade receipt
   restating action, size, fees, and worst case, with the user signing in their own wallet.
7. **No slop.** No emojis in UI labels, no "Powered by AI" badges, no banned marketing lexicon
   (§13). Terse, numeric, addresses the user as a peer.

---

## 3. Trust & provenance model (must survive your redesign)

Every datapoint has a **source string** and a **freshness** level. The current freshness dots:

| Freshness | Meaning | Current color token |
| --- | --- | --- |
| `live` | read this request, ticking | up/green |
| `recent` | cached minutes (e.g. daily ETF flow) | accent |
| `stale` | last-known, upstream lagging | warn |
| `unavailable` | no current value | muted/grey |

Sources you will display (exact strings the app uses):
- `SoDEX mainnet /markets/mark-prices`, `SoDEX mainnet /markets/symbols`
- `SoSoValue /etfs/summary-history`
- `BasisDesk engine + SoSoValue` (for the AI narration's basis line)

Plus a UTC "as of" timestamp per figure. Your design must keep a way to show source + as-of (a dot
+ tooltip is fine; an inline caption is fine; dropping it is not).

---

## 4. Current design tokens (the existing system — change freely, but here's what exists)

Defined in `src/app/globals.css` via Tailwind v4 `@theme`. You may replace these; this is the
baseline so nothing breaks if you keep them.

**Palette (OKLCH).** Dark, near-black base; one brand accent (signal amber); semantic up/down/warn;
risk tints.
- Ink ramp: `ink-950` (page bg) → `ink-50` (primary text), plus `900/850/800/700/600/500/400/300/100`.
- Brand accent: `accent` ≈ amber `oklch(80% 0.16 78)`, `accent-strong`, `accent-muted`, `on-accent` (dark text on amber).
- Semantic: `up` (green), `down` (red), `warn` (amber-orange).
- Risk tints (aligned to the RiskState union): `calm` (green), `watch` (amber), `derisk` (red).
- Role aliases used by components: `background`, `surface`, `surface-raised`, `border`,
  `border-strong`, `foreground`, `muted`, `faint`.

**Type scale (exactly 5 sizes).** `micro` 11px (labels/provenance), `body` 13px (default),
`lead` 16px (section intros), `stat` 28px (the big number), `display` 40px (hero figure).

**Fonts (2 only).** Geist (sans, text) and IBM Plex Mono (mono — carries every number, with
tabular figures + slashed zero). All numeric values render in the mono with `tabular-nums` so
digits never reflow.

**Spacing.** 4px base; only multiples of 4 are reachable (gap-1=4, gap-2=8, …).

**Radii.** `sm` 3px, `md` 5px, `lg` 8px. No pill shapes currently.

**Focus.** Single accent-colored `:focus-visible` ring across all interactive elements (keep an
equivalent — keyboard focus must always be visible).

---

## 5. The number-formatting contract (one module owns all numbers)

`src/lib/format/index.ts` is the single source of truth. No component formats numbers itself. Your
components must render numbers through these (or equivalents that preserve the rules):

| Function | Use | Examples |
| --- | --- | --- |
| `formatUsd(v,{dp,signed,compact,noSymbol})` | USD notionals | `$1,234.50`, `+$1,234.50`, `-$50` |
| `formatCompactUsd(v)` | large USD | `$1.2K` / `$3.4M` / `$5.6B` |
| `formatSignedUsd(v)` | deltas, PnL, funding earned (always signed) | `+$82.00`, `-$12.40` |
| `formatPercent(v,{dp,signed,timeframe})` | rates/APR (input is a **ratio** 0.024 → "2.40%") | `+2.40% (24h)`, `14.23% (7d funding avg)` |
| `formatBps(v,{dp,signed})` | small funding rates (input ratio 0.0001 → "1 bps") | `+0.13 bps`, `-0.5 bps` |
| `formatPrice(v,{dp,noSymbol})` | mark/entry price (precision separate from notionals) | `$63,134`, `$0.0731` |
| `formatQty(v,{dp,unit})` | base-unit token amounts | `0.01189 BTC` |

Rules baked in: **missing → "—"** (never "0"); the sign is placed before the `$`; `signed` adds a
leading `+` for positive; a `timeframe`/provenance suffix is appended in parentheses. Keep all of
this.

---

## 6. Page-by-page spec (every route, every section, every state)

Routes that exist: `/` (home), `/vaults/[id]` (vault detail), `/portfolio`, `/methodology`, plus
`loading`, `error`, `not-found`, `global-error`. Layout wraps all pages in a centered `max-w-6xl`
frame with a sticky header and a footer.

### 6.1 Global frame (`src/app/layout.tsx`, `Header`, `Footer`)
- **Header (sticky, top):** wordmark "BasisDesk" (links home) · primary nav: **Vaults**,
  **Portfolio**, **Methodology** · a "Testnet" badge · the **Connect-wallet control** (see §10).
- **Main:** centered, max width ~1152px, page padding.
- **Footer (every page):** two standing disclosures — "BasisDesk runs on SoDEX testnet.
  Non-custodial: you sign every action with your own wallet, and keys never leave your device." and
  "Not financial advice and not an offer or solicitation. Crypto markets carry risk, including total
  loss of capital." These must remain prominent on every page.
- **AutoRefresh:** home and vault-detail mount an invisible component that re-pulls live server data
  every 30s (pauses on hidden tab). Your design should tolerate values updating in place without
  layout jump (reserve space; avoid reflow). Numbers updating live is a feature — consider a subtle
  "updated" affordance, but never block interaction.

### 6.2 Home `/` (`page.tsx` → `VaultInsight` → `VaultQuoteCard` × N)
Sections, in order:
1. **Hero:** an eyebrow ("Delta-neutral yield"), a headline, and a 2–3 sentence explainer of the
   strategy. Read-only; no wallet needed.
2. **Live basis-trade board** (the core surface): heading + one-line subtitle ("Funding is live
   from SoDEX mainnet … ranked by funding. SoSoValue ETF flows set the de-risk signal. Execution
   runs on the testnet sandbox."), then a responsive grid of **vault cards**, **ranked by funding
   APR (highest first)**. Currently 5 markets: BTC, ETH, SOL, Gold (XAUT), LINK.
3. **Mechanics:** three short explainer cards (Neutralize / Harvest funding / De-risk on signal).

**Vault card** (per vault) must show, each with provenance where it's a live number:
- Title (vault name) + subtitle (market symbol, e.g. "BTC-USD").
- A **risk badge** (Calm / Watch / De-risk) — reflects the composite of funding risk + the
  SoSoValue flow brain.
- **Funding APR (live, mainnet)** as the hero figure, with tone (green if positive, red if
  negative) and a context line: "**Short earns** · +0.13 bps/hr — varies" or "**Short pays** · …".
- A 2×2 stat grid: Net on capital (Nx) · Mark price · Short liquidation room · Next funding (in Xm).
- A **48h price sparkline** (label "<SYMBOL> · 48h · SoDEX").
- **Institutional flow · SoSoValue** block (see flow states §9/§11): when keyed, the regime headline
  ("Day 3 outflow streak") + a stance dot + a "Latest -$77M · AUM $78B" line; when not keyed, an
  explicit "Add a SoSoValue API key …" note.
- The vault blurb (one sentence).
- A link "Open vault and preview a position →".

Card states: populated (above), **error** (funding unavailable → ErrorState with the upstream
reason), and the **flow sub-states** (ok / not-configured / empty / error).

### 6.3 Vault detail `/vaults/[id]` (`vaults/[id]/page.tsx`)
Header: back link "← All vaults" · vault name (display size) · subtitle "BTC-USD · 3x short hedge"
· the **risk badge**.

If the live quote fails → a full-card ErrorState ("Live data unavailable" + recovery copy).

Otherwise a two-column layout (stacks on mobile) + a full-width section below:

**Left column (insight):**
- **Funding APR (live, mainnet)** — display-size stat, provenance, tone, context "Short earns/pays
  · current ±X bps/hr — varies".
- 2×2 summary fields: Net on capital (Nx) · Mark price · Short liquidation room · Maintenance margin.
- **Market block:** "<SYMBOL> · last 48h · SoDEX" + a 48h **price chart** + a signed 48h change %
  in the corner + a 3-up mini-stat row: Mark · Open interest (USD) · 24h volume (USD).
- **Institutional flow · SoSoValue** block (regime headline + latest net flow + AUM, or the gated
  state) + a "Why:" news link (matched SoSoValue headline) when available.
- **What is happening · AI** block: a 1–2 sentence grounded narration + a one-line caveat + a
  "grounded in …" provenance line. States: ok / not-configured ("Set NVIDIA_API_KEY …") / error.
- The vault blurb.
- **Track record** line: "N funding readings logged since <date> · ±X.X% since the last reading"
  when history exists, else "Track record begins now …". **New data to surface here (now
  available):** a "what changed since last reading" headline (funding flipped earns↔pays, flow
  stance changed, or a material funding move). Design a place for this — it's the reason-to-return.

**Right column (action) — `DepositPreview`:**
- A "Deposit (USDC)" amount input + quick presets ($500 / $1,000 / $5,000) + validation ("Enter a
  positive amount").
- A live **position preview** grid (recomputes as the user types): Long <asset> spot (qty · $),
  Short <SYMBOL> · Nx ($ notional · margin $), **Net delta at entry ≈ $0 · market-neutral**,
  Est. funding yield (% · $/yr), Short liquidation ($ · % away), Est. entry fees ($).
- A "Review deposit" button → expands a **risk receipt**: a bulleted restatement (deposit $, buy
  qty spot + short, entry fees, **worst case** through the liquidation price), then the
  sign/execute area (§10).

**Full-width below the grid — `NeutralitySimulator`:**
- Header "Prove it stays neutral" + a sentence.
- A dynamic headline that updates with the slider ("BTC moves -30% to $X — holding loses $Y;
  BasisDesk keeps $Z", or "…past the short's liquidation, the hedge breaks", or the upside case).
- A **chart**: x-axis = price change (-50%…+60%); two lines — a flat "BasisDesk hedged" line and a
  diagonal "holding" line — plus a dashed **liquidation marker** and a dashed **entry-capital**
  reference line, with a movable marker at the current slider price.
- A **range slider** (-50%…+60%).
- A 3-up outcome row: Hold <asset> ($ · ±%), BasisDesk hedged ($ · ±%), Funding (30d) ($ · "short
  earns"/"short pays").
- A caption explaining the math is the same core the deposit signs against.

### 6.4 Portfolio `/portfolio` (`portfolio/page.tsx` → `WalletPortfolio`)
- Title + subtitle.
- **Not connected:** a card prompting wallet connect to see SoDEX account equity, positions, and
  funding earned.
- **Connected:** polls live every 30s. Sections:
  - A 3-up stat row: **Account id** (#) · **Account equity** ($) · **Funding earned (last 25)**
    (signed $).
  - A **wrong-network banner** (if the wallet isn't on ValueChain testnet): "Wrong network —
    switch to ValueChain testnet to close a position." + a Switch button. Close buttons disable
    while on the wrong network.
  - **Open positions** card: a "Refresh" button + either an empty state ("No open positions yet.
    Open one from a vault …") or a list of positions. Each position row: "<SYMBOL> · Short/Long
    <size>", unrealized PnL (signed $, tone), Entry/Liq/leverage line, and a **Close position**
    button (signs a reduceOnly close in the wallet). Per-position close result message (success /
    server error like "account not found").
  - A footnote: live reads from SoDEX; closing signs in the wallet; succeeds once the account is
    funded + whitelisted.

### 6.5 Methodology `/methodology` (`methodology/page.tsx`)
A readable content page (max ~640px) with sections: The strategy · Funding and favorability · The
SoSoValue brain · Deterministic math · AI narration · Custody and risk. Pure prose; style it as a
docs/article surface.

### 6.6 System pages
- **`loading`** (route-level): shown on navigation while server data fetches. Currently a small
  pulsing dot + "Loading live data…". Design instant, non-blocking loading feedback.
- **`error`** (route segment): "Something went wrong" + transient-error copy + a `digest` ref +
  "Try again" (calls `reset()`).
- **`not-found`** (root 404): branded.
- **`global-error`** (root crash): self-contained branded fallback with "Your funds are
  unaffected … non-custodial" reassurance + a reload button.

---

## 7. Component inventory (design-system primitives — replace visuals, keep behavior)

Primitives in `src/components/ui` (props are the contract; restyle freely):
- **Card** — `title?`, `subtitle?`, `actions?`, children. Optional header row (title/subtitle left,
  actions right) + body.
- **Stat** — `label`, `value`, `context?`, `tone?` (neutral/up/down/warn/accent),
  `size?` (stat/display). Label is uppercase micro; value is mono tabular; context is a faint
  caption (carries unit/timeframe/provenance).
- **Badge** — `variant` (neutral/calm/watch/derisk/accent). Small uppercase pill-less chip.
- **Button** — `variant` (primary/secondary/ghost), standard button props, `disabled` styling
  (50% + no pointer events). Has loading text patterns ("Connecting…", "Signing…", "Placing…").
- **ValueWithProvenance** — `value`, `source` (required), `asOf?`, `freshness?`. Renders value + a
  freshness dot + a source/as-of tooltip. This is how provenance attaches to any figure.
- **EmptyState** — `title`, `hint?`, `action?`. Always offers a next action.
- **ErrorState** — `message` (names what failed), `detail?` (upstream reason), `retry?`. Never
  generic "Something went wrong" in data surfaces.
- **Skeleton** — loading placeholder block.

Domain components in `src/components/vault` + `src/components` (behavior is the contract):
- **VaultInsight / VaultInsightSkeleton** — async board: fetches + ranks vaults, renders the grid;
  skeleton shows N card placeholders.
- **VaultQuoteCard** — one vault card (§6.2).
- **VaultNarration / VaultNarrationSkeleton** — the AI block (§6.3).
- **DepositPreview** — the deposit/preview/receipt/sign flow (§6.3, §10). Client.
- **NeutralitySimulator** — the interactive proof (§6.3). Client.
- **PriceChart** — dependency-free SVG line chart from a number[] of closes; color = net direction.
- **WalletPortfolio** — the portfolio + close flow (§6.4). Client.
- **AutoRefresh** — invisible 30s live refresher (§6.1).
- **ConnectButton** — wallet control (§10).

---

## 8. Real-time, freshness & performance behavior
- **Auto-refresh:** home + detail re-pull server data every 30s (visibility-aware). Portfolio polls
  every 30s. Design must not jump/reflow on update; reserve space for variable-length numbers (use
  tabular figures).
- **Caching (server-side, already handled):** SoSoValue flow/news cached ~10 min (daily data); AI
  narration cached ~5 min. Market data (funding/price) is live per refresh. You don't manage this,
  but it explains why funding ticks but flow/news change slowly.
- **Provenance dots** communicate freshness; keep them or an equivalent.

---

## 9. Data dictionary (exact shapes the UI consumes — fields, units, nullability)

**VaultQuote** (per vault, computed by the deterministic core):
- `vault`: `{ id, name, symbol ("BTC-USD"), baseAsset ("BTC"), blurb, targetLeverage (e.g. 3) }`
- `symbolId`: number|null (execution market id)
- `markPrice`: number (USD)
- `fundingRatePerInterval`: number (hourly ratio; **positive = the short is paid**)
- `fundingIntervalSec`: number (e.g. 3600)
- `fundingAprOnNotional`: number (ratio, annualized; can be **negative**)
- `fundingAprOnCapital`: number (ratio, annualized at leverage; can be negative)
- `maintenanceMarginRate`: number (ratio)
- `takerFee`: number (ratio)
- `liquidationDistance`: number (fraction the price must rise to liquidate the short; positive =
  headroom)
- `nextFundingTime`: number (epoch ms)
- `fundingPositive`: boolean (drives "short earns" vs "short pays")
- `risk`: `{ state: "calm"|"watch"|"derisk", reasons: string[] }`
- `asOf`: ISO string · `sources`: `{ markPrice, spec }`

**FlowRegime** (the SoSoValue brain, per asset):
- `symbol`, `latestDate` (YYYY-MM-DD), `latestNetInflowUsd` (USD, signed)
- `direction`: "inflow"|"outflow"|"flat" · `streakDays`: number · `flippedToday`: boolean
- `cumNetInflowUsd`: number|null · `aumUsd`: number|null
- `stance`: "supportive"|"neutral"|"caution" · `headline`: string ("Day 3 outflow streak")
- **Composite brain fields (surface these):** `magnitudeScore`, `streakScore`, `trendScore`,
  `compositeScore` (−1…+1), `conviction` ("low"|"medium"|"high"), `sizeMultiplier` (0.5…1.0 — the
  suggested position-size factor when flows say caution).
- Wrapper `FlowRegimeResult.state`: "ok" | "not_configured" | "empty" | "error".

**News** (`FlowNewsResult`): `state` "ok"|"none"|"not_configured"|"error"; `item`:
`{ id, title, content, sourceLink, releaseTime (epoch ms), currencies: [{name, fullName}] }`.

**HistorySummary** (track record + change detection): `count`, `firstTs`, `lastTs`, `latest`,
`previous`, `fundingAprChange` (ratio|null), `avgFundingApr`, **`fundingFlipped`** (bool),
**`stanceChanged`** (bool), **`changeHeadline`** (string|null — "funding flipped to paying;
institutional flow turned caution"). Surface `changeHeadline` prominently when present.

**DepositPreview** (computed as the user types): `capitalUsd`, `qty`, `spotCostUsd`, `marginUsd`,
`shortNotionalUsd`, `liquidationPrice`, `liquidationDistance`, `entryFeesUsd`, `netDeltaUsd` (≈0).

**SimulateResult** (per slider position): `priceChangePct`, `hedgedValueUsd`, `hedgedPnlUsd`,
`hedgedPnlPct`, `spotValueUsd`, `shortPnlUsd`, `fundingEarnedUsd` (signed), `liquidated` (bool),
`liquidationPrice`, `holdValueUsd`, `holdPnlUsd`, `holdPnlPct`.

**NarrationResult**: `state` "ok"|"not_configured"|"error"; ok adds `summary`, `confidence`
("high"|"medium"|"low"), `caveat`, `basis: string[]`, `asOf`.

**Portfolio** (`GET /api/sodex/portfolio?address=`): `aid` (number|null), `equity`
`{ available, margin }` (string USD|null), `positions: [{ symbol, symbolId, size (string, "-"
prefix = short), entryPrice, unrealizedPnL?, liquidationPrice?, leverage? }]`, `funding:
[{ symbol, fundingAmount (string), fundingTime (epoch ms) }]`.

---

## 10. Wallet & signing interaction model (web3 — must be exact)

- **Connector:** browser-injected wallet only (MetaMask-class). No WalletConnect/Coinbase modal
  currently.
- **Chain:** ValueChain Testnet, chainId **138565**, native token "SOSO". Execution + account reads
  are on testnet; market data is mainnet (display only).
- **ConnectButton states (Header):**
  1. server/not-mounted → invisible placeholder (prevents hydration flash);
  2. disconnected → "Connect wallet" (→ "Connecting…" while pending);
  3. connected + wrong chain → "Switch to ValueChain";
  4. connected + right chain → shows the short address (`0x1234…abcd`), click to disconnect.
- **Deposit/sign flow (DepositPreview, when connected):**
  - The SoDEX **account id auto-resolves** from the wallet ("· resolving…" → filled, still
    editable).
  - If on the wrong chain → a "Switch to ValueChain testnet" button replaces the sign button.
  - Sign button cycles: "Sign and place hedge" → "Sign in wallet…" → "Placing…" → result. Result
    is a success ("Hedge order placed.") or the server's honest message (e.g. "account not found"
    for a non-whitelisted account). On success the page refetches.
  - A standing note: signing/submission are implemented + tested; submission needs a whitelisted
    SoDEX testnet account; signing happens in the wallet, keys never leave the device.
- **Close flow (WalletPortfolio):** same network guard; "Close position" → "Closing…" → result;
  refetches on success.
- **Errors to design:** user rejects signature, wrong network, no injected wallet, account not
  found, rate-limited. All must show a specific, recoverable message (never a dead spinner).

---

## 11. The five states for every data surface (explicit)

For each surface below, design all listed states.

| Surface | loading | empty | error | not-configured / stale | populated |
| --- | --- | --- | --- | --- | --- |
| Vault board / card | skeleton cards | (n/a — always has markets) | "Live funding unavailable" + reason | flow sub-states | ranked cards |
| Funding/price/market | (covered by route loading) | — | ErrorState w/ kind | "as of" stale dot | live figures |
| SoSoValue flow | inherits | "No recent ETF-flow data for this asset" | "SoSoValue flow unavailable (<kind>)" | "Add a SoSoValue API key …" | regime + composite |
| News "why" | inherits | hidden (no matched item) | hidden/soft | "Add a key" (via flow) | linked headline |
| AI narration | VaultNarrationSkeleton | — | "AI explanation unavailable right now." | "Set NVIDIA_API_KEY …" | summary + caveat |
| Track record | inherits | "Track record begins now …" | soft | — | "N readings … + change headline" |
| Deposit preview | — | invalid amount hint | — | — | full preview + receipt |
| Portfolio | "Reading your SoDEX account…" | "No open positions yet …" | (network/auth surfaced inline) | not-connected card | equity + positions |

Error copy must name the cause (status code, rate-limit, not-configured) and offer recovery —
never a generic "Something went wrong" in a data surface.

---

## 12. Responsive & accessibility requirements
- **Mobile-first, fully responsive.** The board grid (5 cards), the detail two-column layout, the
  portfolio position rows, and the simulator chart + slider must all work down to ~360px. Tables/
  rows should wrap or scroll gracefully; the simulator slider must be touch-usable.
- **No hover-only affordances** (touch has no hover). Provenance currently lives in a `title`
  tooltip — on touch, provide an alternative (tap-to-reveal, inline caption, or a details row).
- **Keyboard:** every control operable; visible focus ring; the simulator slider keyboard-operable.
- **Screen readers:** label icon-only controls; the price/sim charts have an `aria-label`; don't
  encode meaning in color alone (pair with sign/arrow/text).
- **Tabular numerals** everywhere numbers update live (prevents reflow).
- **Contrast:** the amber accent on dark and the up/down on dark must meet contrast for text.

---

## 13. Voice, copy & legal (fixed)
- **Voice:** terse, numeric, peer-to-peer. Name the actual index/endpoint/number.
- **Zero emojis** in UI labels. No "Powered by AI" badges. No disabled buttons with "coming soon".
- **Banned lexicon** (do not use in any UI text): seamless, effortless, unlock, unleash, empower,
  revolutionize, game-changing, cutting-edge, leverage (as a verb — "3x leverage" the noun is
  fine), robust, comprehensive, elevate, supercharge, one-stop, delve, "in today's fast-paced
  world", "whether you're X or Y", "the power of", "it's not just X, it's Y", rhetorical-question
  openers.
- **Disclaimers (must stay visible):** the two footer lines (§6.1). Not financial advice;
  non-custodial; testnet; total-loss risk.
- **Honesty in labels:** "Funding APR (live, mainnet)", "Execution: testnet sandbox", "short
  earns/pays" — keep these honest qualifiers; don't simplify them away.

---

## 14. Assets
- **Brand mark / favicon:** `src/app/icon.svg` — a small amber price-line on a near-black tile.
  You may redesign; keep an SVG icon (no default placeholder).
- **Reference screenshots** of the current UI: `docs/assets/bd-home.png`,
  `docs/assets/bd-vault-detail.png`, `docs/assets/bd-portfolio.png` (use as functional reference,
  not a style mandate).
- No logo lockup or illustration set exists yet — that's yours to create.

---

## 15. Surfaces not yet built (design with these in mind / leave hooks)
- **Connected-wallet dashboard / "since your last visit"** feed: the change-detection data
  (`changeHeadline`, funding flips, stance changes) now exists but only appears as a line on the
  detail track record. A home or portfolio "what changed" surface would use it well.
- **Position management on the detail page** (your open position inline on the vault you're viewing)
  — currently only the global `/portfolio` shows positions.
- **Onboarding / first-run** explainer to hit "aha" in under 60s (the interactive simulator is the
  best candidate to feature).
- **Global toast/notification system** — feedback is currently inline strings; a toast layer would
  centralize success/error/network feedback.
- **Settings / account / API-key status** surface (which integrations are live).
- **Deep-linking / shareable state** (e.g. a simulated scenario or a chosen deposit amount in the
  URL).
- **Pooled multi-user vault** (shared TVL, vault shares, other depositors) — a deliberate future
  product that would add TVL, depositor counts, and shared/real-time state. Not built; do not
  design it as if it exists, but a layout that could grow into it is welcome.

---

## 16. Quick reference: what every screen must never do
- Never show a number without a source + freshness.
- Never show "0" for missing data (use "—").
- Never convey up/down by color alone.
- Never present a fund-moving action without the pre-trade receipt + wallet signature.
- Never use a banned word, an emoji in a label, or a generic "Something went wrong".
- Never block the UI on a spinner with no escape — every async path has loading/empty/error.

Build the visual language you want on top of this. If something you need isn't specified here,
it's genuinely your call — but everything listed above is load-bearing and must survive the
redesign.
