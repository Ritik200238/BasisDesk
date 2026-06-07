# Architecture

BasisDesk composes a pure finance core with two typed data clients, behind Next.js server
components that read live data per request.

## Layers

1. **Deterministic core (`src/lib/core`)** — framework-free, network-free, fully unit-tested.
   Sizing, net delta, funding annualization, NAV (with the price-invariance property that
   proves market-neutrality), and risk classification. All money math uses `dnum` fixed-point.
   This is the layer every figure flows through, so the numbers are reproducible and auditable.

2. **Data clients**
   - `src/lib/sodex` — read-only public endpoints (mark-prices, funding, symbols, positions).
     Typed fetch with timeout, retry, 429 handling, and zod validation. No key, no whitelist
     required for market data. The signed write-path is a separate, gated module.
   - `src/lib/sosovalue` — OpenAPI client (ETF flows, news). Gated behind `SOSOVALUE_API_KEY`:
     with no key it returns a typed `not_configured` result and the UI renders a connect-key
     state. Sliding-window rate limiter, retry, zod validation, envelope-flexible parsing.

3. **Domain (`src/lib/vault`, `src/lib/flows`)** — composes core + clients into product
   concepts: a vault quote (funding APR, capital yield, liquidation, risk), the deposit preview,
   and the ETF-flow regime that escalates risk to de-risk on outflows. Pure and tested.

4. **UI (`src/app`, `src/components`)** — Next.js App Router. Server components fetch live data
   per request (`dynamic = "force-dynamic"`, `cache: "no-store"`) and stream into a design
   system that enforces provenance: the `ValueWithProvenance` primitive requires a `source`, so
   an unsourced number is structurally impossible. The deposit preview is a client component
   that recomputes via the same core as the user types.

## Data flow (a vault card)

```
SoDEX /markets/mark-prices + /markets/symbols  ->  lib/sodex (typed, validated)
SoSoValue /etfs/summary-history                ->  lib/sosovalue (gated, validated)
            |                                              |
            v                                              v
   lib/vault/quote.buildVaultQuote            lib/flows/regime.computeFlowRegime
            |                                              |
            +---------------------+------------------------+
                                  v
                      escalateForFlow -> risk badge
                                  v
              server component -> VaultQuoteCard (with provenance)
```

## Key decisions

- **Next 15.5, not 16.** Next 16.2.7 fails `next build` prerendering the internal
  `/_global-error` route (framework regression). Pinned to the latest stable 15.5 line.
- **dnum for money.** No IEEE floats for amounts/prices/balances. Ratios are converted to
  number only at the display edge, after exact math.
- **Gated, never mocked.** Missing key or upstream failure renders an explicit state with the
  reason — never a fabricated value. This is enforced at the client (typed error kinds) and the
  UI (five states per surface).
- **Non-custodial by construction.** The backend only ever sees public addresses and signed
  intents. There is no path that accepts a private key.
