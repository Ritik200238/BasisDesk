# BasisDesk — Design Brief

A handoff for the frontend designer. This document explains what the product is,
who it is for, what each screen has to accomplish, the exact data every surface
shows, and the rules that content and numbers must follow. It does not prescribe
a visual style — that direction is yours to create. Design fresh.

---

## 1. What you are designing, in one paragraph

BasisDesk is an on-chain, delta-neutral yield product. A user deposits into a
"vault" that holds a crypto asset (say BTC) and simultaneously shorts the matching
perpetual future in equal size, so the position's dollar value barely moves when
the price moves. The yield comes from the funding rate the short is paid every
hour. The product reads live institutional ETF-flow data from SoSoValue to decide
when each vault should hold its full position and when it should reduce risk
("de-risk"). Trades execute on SoDEX (a perpetuals exchange). The whole thing is
non-custodial: the user signs every money-moving action in their own wallet.

One-line: **Delta-neutral yield — earn the funding rate without betting on the
price. SoSoValue flows decide when to hold and when to step back.**

---

## 2. The one user and the one job

**User:** a crypto holder who owns BTC/ETH and wants yield on it without taking a
directional bet, but who does not have the time, tools, or trading-desk skill to
run a hedged basis trade by hand.

**Job:** "Help me earn a steady return on my crypto that keeps working whether the
market goes up or down, and prove to me it is real before I commit money."

Design every screen to serve that one job. The emotional target is **calm,
earned trust** — this is money and risk, not a game. The user should reach the
core insight (what the yield is, that it is market-neutral, what the risk is)
within 60 seconds, before connecting a wallet.

---

## 3. Product principles that shape the design

These are non-negotiable product rules. They constrain layout and content, so
design around them.

1. **Every number is real and sourced.** Each figure on screen carries its unit,
   its timeframe, its data source, and an "as of" timestamp. Design a consistent
   way to show provenance (source + freshness) attached to a value without
   cluttering it. A bare number with no context is not acceptable.
2. **Honesty over polish.** When data is missing or an asset is unsupported, the
   screen says so plainly. Nothing is faked to look fuller.
3. **Read before connect.** The full value (funding, flows, risk, the neutrality
   proof) must be understandable with no wallet connected. Wallet connection is
   only required to actually deposit.
4. **Every money action is confirmed.** Before any deposit or trade, the user sees
   a confirmation restating the exact action, size, estimated price, fees, and
   worst-case downside, with a cancel option. Nothing auto-executes.
5. **Serious, numeric voice.** Terse, specific, addresses the user as a peer. No
   marketing hype (see Section 9 for banned words).

---

## 4. The core loop (design the flow around this)

1. Land on the marketplace → see live vaults ranked by yield, each with a risk
   state and the institutional-flow signal. No wallet needed.
2. Open a vault → understand the honest pitch: the live funding yield, that the
   position is market-neutral, the worst case, and where the yield comes from.
3. Interact with the neutrality proof (a price simulator) → see the hedge hold
   value where simply holding would swing.
4. Preview a deposit → see the exact hedged position that will be opened (both
   legs, net delta, yield, liquidation distance, fees).
5. Connect wallet → confirm the pre-trade receipt → sign.
6. Return later → a dashboard shows position value, that delta is still ~0,
   funding earned so far, and the current risk state. What changed since last
   visit is surfaced.

---

## 5. Screens to design

For each screen: its purpose, the content it must present, and the primary action.

### 5.1 Marketplace (home)
- **Purpose:** show the range of vaults and let the user pick one; deliver insight
  with no wallet.
- **Must present:** a short thesis header (what the product does in one breath); a
  ranked list of vault cards. Each card shows: vault name + market symbol; the
  live funding APR (the headline number) with a "short earns / short pays" label;
  net yield on capital at the vault's leverage; current mark price; short
  liquidation room; time to next funding; a small recent price trend; the
  institutional-flow signal (direction, streak, latest net flow, AUM); and a risk
  badge (calm / watch / de-risk). One vault may show an unsupported/empty flow
  state honestly.
- **Primary action:** open a vault ("preview a position").
- **Vaults to represent:** BTC, ETH, SOL, LINK, and gold — all "Market-Neutral,"
  each a 3x short hedge.

### 5.2 Vault detail
- **Purpose:** the honest, complete pitch for one vault plus the deposit entry
  point.
- **Must present, grouped sensibly:**
  - **Headline:** vault name, market symbol, leverage, and the current risk badge.
  - **Funding block:** funding APR (live, from mainnet) as the hero figure; net
    yield on capital at leverage; mark price; short liquidation room; maintenance
    margin.
  - **Market block:** a 48-hour price series; mark price; open interest; 24h
    volume; 24h change.
  - **Institutional flow block (SoSoValue):** a headline (e.g. "Day 11 outflow
    streak"); latest net flow (signed, colored up/down); AUM; and a linked news
    headline that explains the "why" behind the flow.
  - **Plain-language explanation block:** one or two grounded sentences describing
    what is happening, plus a short caveat and a "grounded in [sources]" line with
    a timestamp. (This content is machine-generated but always cites real figures;
    design it to look like a cited fact, not a chatbot.)
  - **Deposit preview (see 5.3).**
  - **Neutrality simulator (see 5.4).**
  - **Track record:** a one-line note of how many funding readings have been
    logged and since when, and the change since the last reading.
- **Primary action:** review a deposit.

### 5.3 Deposit preview (part of vault detail)
- **Purpose:** let the user model a deposit and see the exact hedged position
  before committing.
- **Must present:** a deposit amount input (USDC) with quick presets; then the
  computed position — the long spot leg (quantity and dollar value); the short
  perp leg (dollar value and margin); **net delta at entry** shown as ~$0 with a
  "market-neutral" label (this is the trust moment — make it unmistakable);
  estimated annual funding yield (percent and dollars per year); short liquidation
  price and how far away it is; estimated entry fees.
- **Primary action:** review deposit → opens the pre-trade confirmation (5.6).

### 5.4 Neutrality simulator (part of vault detail)
- **Purpose:** prove, interactively, that the hedge cancels price risk.
- **Must present:** a control to move the asset price up or down across a range
  (roughly -50% to +60%); two plotted outcomes over that range — "holding the
  asset" (moves with price) versus "the BasisDesk hedge" (stays flat); a marker
  where liquidation would occur; and summary tiles comparing the two outcomes at
  the chosen price plus the funding earned over a period. A short caption states
  that the hedged line is flat because the two legs cancel, and that this is the
  same math the deposit is signed against.

### 5.5 Portfolio
- **Purpose:** the returning-user dashboard for a connected wallet.
- **Must present (connected):** account equity; open hedge positions with their
  current value and net delta (still ~0); funding earned to date; current risk
  state. **Must present (not connected):** a clear, inviting prompt to connect,
  explaining what will appear — this is a first-class state, not an afterthought.

### 5.6 Pre-trade confirmation (modal or step)
- **Purpose:** the mandatory safety gate before signing.
- **Must present:** the exact action, market, size, estimated price, estimated
  slippage and fees, the network (testnet), and the worst-case downside, with a
  clear cancel and a clear confirm. This should feel deliberate and reassuring,
  not like a dismissable popup.

### 5.7 Methodology
- **Purpose:** prove rigor; show where every number comes from.
- **Must present:** short sections explaining the strategy, how funding and
  favorability are computed, how the SoSoValue flow signal works, that all
  financial math is deterministic and tested (not produced by an AI), how the AI
  narration is constrained, and the custody/risk posture. This is a
  trust-and-transparency page; it should read as authoritative and be genuinely
  pleasant to read, not a dense legal block.

### 5.8 Global chrome
- A top bar with the product mark, primary navigation (Vaults, Portfolio,
  Methodology), a network indicator (Testnet), and a wallet connect control.
- A footer with the non-custodial statement and legal disclaimer (Section 9).

---

## 6. Data dictionary (the real fields, with meaning and units)

Design labels and formatting around these. Names are plain-language; use them.

| Field | Meaning | Unit / format |
|---|---|---|
| Funding APR | Annualized funding rate the short earns; the yield | percent, e.g. 10.95% |
| Funding rate (per hour) | Current hourly funding | basis points/hour, signed |
| Short earns / short pays | Whether funding is positive (earn) or negative (pay) | label |
| Net yield on capital | Funding APR amplified by leverage | percent |
| Mark price | Current perp mark price | USD price |
| Short liquidation room | Distance from mark to the short's liquidation price | percent |
| Maintenance margin | Required maintenance margin rate | percent |
| Net delta | Net directional exposure of the hedged position | USD; target ~$0 |
| Est. funding yield | Projected yield on a modeled deposit | percent and USD/yr |
| Entry fees | Estimated taker fees to open | USD |
| Flow headline | Summary of the ETF-flow regime | text, e.g. "Day 3 inflow streak" |
| Latest net flow | Most recent daily ETF net in/outflow | USD, signed, compact (K/M/B) |
| AUM | Assets under management of the tracked ETFs | USD, compact |
| Risk state | calm / watch / de-risk | one of three |
| Open interest | Perp open interest, notional | USD, compact |
| 24h volume | Perp quote volume | USD, compact |
| Funding earned | Realized funding for a position | USD |

Assets in scope: **BTC, ETH, SOL, LINK, gold (XAUT)**. Gold has no spot ETF, so
its flow surface must show an honest empty state.

---

## 7. Number and data-display rules

- Every value carries context inline: unit, timeframe, and provenance. "+2.4%"
  alone is wrong; "+2.4% (24h)" is right. "APY 14.2% (7d funding avg)" not
  "14.2%".
- Gains/losses are never conveyed by color alone — always pair with a sign or
  arrow, because color-blind users and grayscale prints must still read direction.
- Design a single, consistent treatment for: prices, percentages, basis points,
  large numbers (K/M/B), negative values, and null/unavailable ("—").
- Show a visible "as of [time]" and a freshness indicator (live / recent / stale)
  wherever data can age.
- Two different time bases exist and must never be blended silently: **crypto
  funding and prices are 24/7 and near-real-time; ETF flows are business-day and
  settle a day late (T+1).** Label each accordingly.

---

## 8. Every data surface needs five states

For each screen and each data block, design all five — not just the happy path:

1. **Loading** — a skeleton, not a spinner-only blank.
2. **Empty** — with a clear next action or an honest "no data for this asset."
3. **Error** — a specific cause and a recovery path. Never a generic "Something
   went wrong."
4. **Partial / stale** — last-known value shown with a visible "as of" and a
   staleness cue.
5. **Populated** — the full, live state.

The empty and error states are where most products look unfinished. Treat them as
first-class.

---

## 9. Voice, copy, and legal

- **Tone:** terse, numeric, confident, addresses the user as a peer. Name the
  actual thing (the index, the endpoint, the number) rather than describing it
  vaguely.
- **Banned words** (do not use in any label, heading, or body): seamless,
  effortless, unlock, unleash, empower, revolutionize, game-changing,
  cutting-edge, leverage (as a verb), robust, comprehensive, elevate, supercharge,
  one-stop, delve. Avoid rhetorical-question openers and "it's not just X, it's Y."
- **No emojis** in labels or body copy.
- **No hype or guarantees.** Never imply a price target, a guaranteed return, or
  "buy now." Funding can turn negative; the product states this honestly.
- **Required legal posture** (persistent, e.g. footer): "Not financial advice and
  not an offer or solicitation. Crypto markets carry risk, including total loss of
  capital." Plus the non-custodial line: "You sign every action with your own
  wallet; keys never leave your device." And a testnet notice where relevant.

---

## 10. Wallet and network model

Design these states explicitly:
- **No wallet connected** — the default first-run; full read-only value is still
  visible.
- **Connecting** — in-progress feedback.
- **Connected** — address shown, portfolio unlocked.
- **Wrong network** — detected, with a one-click switch.
- **Account switched** — the UI updates to the new address.
- **Testnet banner/indicator** — always visible; if a real-funds mainnet mode
  ever exists, it must be an unmistakable, distinct visual state.

---

## 11. Existing assets you may use or evolve

- A logo mark and wordmark exist as SVG (`/public/logo.svg`, `/public/logo-mark.svg`).
  Use them, refine them, or propose new — your call. The product name is
  **BasisDesk** (one word, capital B and D).
- There is one brand accent color already in use, but you are free to define the
  full visual language, type system, and color palette. Do not feel bound by the
  current look.

---

## 12. What we need delivered

- High-fidelity designs for: Marketplace, Vault detail (including deposit preview
  and neutrality simulator), Portfolio (connected and not-connected), Pre-trade
  confirmation, Methodology, and the global top bar + footer.
- All five states for each data surface (Section 8).
- A type scale, spacing system, color palette (including semantic up/down/warn and
  the three risk states calm/watch/de-risk), and the provenance/"as of" treatment
  as a reusable pattern.
- Responsive layouts: this is used on desktop and mobile; the reading experience
  and the deposit flow must both work on a phone.
- Accessible by default: sufficient contrast, never color-only meaning, keyboard
  and screen-reader friendly.

Questions on any data field or flow: ask, and we will show you the live values.
```
