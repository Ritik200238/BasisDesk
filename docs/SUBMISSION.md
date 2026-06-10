# BasisDesk — Buildathon submission

Pre-filled for the SoSoValue Buildathon form. Fill the bracketed blanks (demo URL, video,
team) and paste.

## 1. Project overview

- **Project name:** BasisDesk
- **Short description:** A delta-neutral on-chain yield vault. It holds a crypto asset spot and
  shorts the matching SoDEX perpetual in equal size, so price exposure nets to zero, and earns
  the funding rate as yield. SoSoValue spot-ETF flow data drives the de-risk signal.
- **Target user:** A crypto holder who wants a steady, hedged return on BTC/ETH/SOL without
  day-trading and without the price risk of just holding — the basis trade (Ethena-shaped),
  packaged as a vault.
- **Core logic:** Live SoDEX mark price + funding rate + market spec feed a deterministic,
  unit-tested engine that computes the market-neutral funding APR, the exact hedged position
  (spot qty, short notional, margin, liquidation price, fees, zero entry delta), and a risk
  state. SoSoValue daily ETF flows are reduced to a regime (inflow/outflow streaks, flips) that
  escalates the vault to de-risk on outflows; SoSoValue news supplies the grounded "why." An
  optional LLM narrates these figures — it never computes a number.
- **APIs and data sources:**
  - SoSoValue OpenAPI (load-bearing): `GET /etfs/summary-history` (daily net inflow, AUM,
    cumulative), `GET /news/featured` (the "why").
  - SoDEX Trading API: `GET /markets/mark-prices`, `/markets/symbols`, `/accounts/{addr}/positions`,
    `/accounts/{addr}/fundings`; EIP-712 order signing on ValueChain L1 (chainId 138565).
  - On-chain: wallet connect via wagmi/viem; non-custodial signing.

## 2. Public GitHub repo

https://github.com/Ritik200238/BasisDesk — README with setup, plus docs/ARCHITECTURE,
docs/CLAIMS (data lineage), docs/SCOPE.

## 3. Demo

https://basisdesk.vercel.app — live SoDEX funding renders immediately (no keys needed). Add a
SoSoValue key for the flow signal + news, and ANTHROPIC_API_KEY for AI narration.

## 4. Video

[ short walkthrough: landing live funding -> open a vault -> deposit preview -> risk receipt ]

## 5. Team

[ members + contact ]

## 6. Wave changelog

- Deterministic finance core (sizing, delta, funding, NAV price-invariance, risk, scenario) —
  unit-tested (76 tests)
- Ranked basis-trade board across 5 markets (BTC, ETH, SOL, gold, LINK) on real SoDEX **mainnet**
  funding, with short-earns / short-pays favorability; execution on the testnet sandbox
- SoSoValue brain (live): a multi-factor composite of ETF-flow direction, streak, magnitude, and
  trend -> conviction + a position-size multiplier + graded de-risk; matched news as the "why"
- Interactive neutrality simulator: drag the price, watch the hedge stay flat versus holding
- EIP-712 order signing + submission, ported and verified against the public SoDEX SDK and the
  live testnet (gated only on a whitelisted account)
- Connected-wallet portfolio + one-signature redeem; live auto-refresh; post-action refetch
- Grounded AI narration (live) via NVIDIA's OpenAI-compatible API
- Deployed on Vercel; clean production build; provenance on every number

## How it maps to the judging criteria

- **User Value & Practical Impact (30%):** hedged yield with ~0 price risk on real assets; the
  vault answers a concrete decision (deposit / hold / de-risk) with live, sourced numbers.
- **Functionality & Working Demo (25%):** live SoDEX funding -> APR, deposit preview, and the
  confirmation receipt all run on real data; production build verified green.
- **Logic, Workflow & Product Design (20%):** a clean data -> insight -> reviewed-decision loop
  on a deterministic, tested core; every figure is reproducible.
- **Data / API Integration (15%):** SoSoValue is load-bearing — a multi-factor composite of its
  ETF-flow data drives conviction, position sizing, and graded de-risk, with matched news as the
  grounded "why." SoDEX mainnet market data + EIP-712 signing/submission are verified live; AI
  narration runs on NVIDIA.
- **UX & Clarity (10%):** provenance on every number, five UI states per surface, live
  auto-refresh, honest states, no slop (audited).

## What is gated / pending external access

- SoSoValue flow signal + news and AI narration: configured and **live** on the deployment.
- On-chain order acceptance + redeem: built and verified end-to-end against the live testnet,
  gated only on a whitelisted SoDEX testnet account (the signed request is confirmed correct, not
  guessed).
- A pooled multi-user vault (shared TVL, vault shares, other depositors) is deliberate future
  scope; the current product is a per-wallet hedged-position tool on shared live market data.
