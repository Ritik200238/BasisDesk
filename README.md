# BasisDesk

Delta-neutral yield, on-chain. Hold the asset, short the matching SoDEX perpetual in equal
size, and earn the funding rate while net price exposure stays near zero. SoSoValue spot-ETF
flow data sets the de-risk signal.

BasisDesk is for a crypto holder who wants a steady, hedged return on BTC or ETH without
day-trading and without the price risk of just holding. The same basis trade that grew
Ethena to multi-billion scale, packaged as a vault and driven by live data.

## How it works

For every unit of spot the vault holds, it shorts one unit of the perpetual. If price moves,
the two legs cancel:

- Deposit $1,000 into the BTC vault.
- It buys ~$750 of BTC spot and posts ~$250 as margin to short an equal-sized BTC-USD perp at 3x.
- BTC drops 20%: spot loses, the short gains the same amount. Net value barely moves.
- The yield is the funding rate the short collects each hour — paid by crowded longs, not by token inflation.

SoSoValue's daily ETF flows decide when to step back: when institutions turn to net outflows,
the vault's de-risk signal escalates from calm to de-risk.

## What is live right now

- **Live funding to APY.** SoDEX testnet mark prices and funding rates are read per request and
  annualized by a deterministic, unit-tested engine. The landing shows real BTC and ETH
  market-neutral funding APR with source provenance — no wallet or key required.
- **SoSoValue de-risk signal.** With a SoSoValue API key set, the daily ETF-flow regime
  (inflow/outflow streaks, flips) drives each vault's risk badge. Without a key, the UI shows an
  explicit connect-key state — never mock data.
- **Deposit preview and risk receipt.** The vault detail page computes the exact hedged position
  from the live mark price (spot qty, short notional, margin, liquidation price, entry fees,
  zero entry delta) and a confirmation receipt that restates size, fees, and worst case.
- **Honest gating.** On-chain execution requires SoDEX testnet access (whitelist) and a
  connected wallet; signing is non-custodial and happens in the user's wallet. Until access is
  granted, the flow stops at the reviewed receipt rather than a dead button.

## Architecture

```
src/lib/core/       deterministic finance engine (sizing, delta, funding, NAV, risk) - pure, tested
src/lib/sodex/      SoDEX read client (markets, mark-prices, funding, positions) - verified vs live testnet
src/lib/sosovalue/  SoSoValue OpenAPI client (ETF flows, news) - gated behind SOSOVALUE_API_KEY
src/lib/flows/      ETF-flow regime engine: streak/flip detection -> de-risk stance
src/lib/vault/      vault catalog + quote + deposit preview, composed from core + clients
src/lib/format/     the single number-formatting module (dnum-backed, null-safe)
src/components/      design-system primitives + vault UI
src/app/            Next.js App Router (server components fetch live data per request)
```

All money math runs through `dnum` (bigint fixed-point), never IEEE floats. The LLM layer (when
enabled) only narrates figures the engine has already computed — it never does arithmetic.

## Data sources

Every user-facing number traces to a real upstream (see `docs/CLAIMS.md`):

| Surface | Source |
| --- | --- |
| Funding rate, mark price, market spec | SoDEX GET /markets/mark-prices, /markets/symbols |
| Funding APR, capital yield, liquidation, delta | deterministic core from the live mark + spec |
| Institutional flow regime | SoSoValue GET /etfs/summary-history |
| Grounded news | SoSoValue GET /news/featured |

## Run it locally

Requires Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local   # add SOSOVALUE_API_KEY to enable the flow signal (optional)
pnpm dev                     # http://localhost:3000
```

SoDEX public market data needs no key, so the landing shows live funding immediately. Add a
SoSoValue key to light up the de-risk signal.

```bash
pnpm test        # unit tests for the finance core, formatting, clients, flow regime
pnpm typecheck   # tsc --noEmit
```

## Stack

Next.js 15.5 (App Router), React 19, TypeScript, Tailwind v4, dnum, zod, wagmi/viem, Vitest.
Deploys on Vercel.

## Status

Live: read-only insight (funding + flow), deposit preview, confirmation receipt.
In progress: wallet connect, SoDEX EIP-712 order signing (gated on testnet whitelist), grounded
AI narration, accumulated funding/flow history. See `docs/SCOPE.md`.

## Disclaimers

Not financial advice, and not an offer or solicitation. BasisDesk is non-custodial — it never
holds keys or funds. Crypto markets carry risk, including total loss of capital. Testnet only.
