# Scope ledger

The wedge is one loop built deep: live data -> market-neutral quote -> deposit preview ->
reviewed receipt. The default answer to a new feature is "backlog it."

## Done

- Live SoDEX funding -> market-neutral APR for BTC and ETH
- SoSoValue ETF-flow regime -> de-risk signal on the vault (needs a key to light up)
- SoSoValue news "why" under the flow regime (second load-bearing endpoint, needs a key)
- Vault detail with deposit preview + confirmation risk receipt
- Grounded AI narration of vault state (needs ANTHROPIC_API_KEY)
- Accumulated funding/flow history moat: cron snapshot + track record (store swappable for a DB)
- Wallet connect (wagmi injected) + ValueChain network switch, verified in a clean-cased copy
  (production build green, runtime renders with no hook error)

## Verified

- Production build is green and all routes render in a consistently-cased checkout (mirrors the
  Linux deploy environment). A mixed-case Windows folder path is the only env that loads React
  twice; a normal clone or Vercel is unaffected.

## Blocked (needs external access or the exact schema)

- SoDEX EIP-712 order signing: the exact typed-data schema is abstracted inside SoDEX's Go SDK
  and not published; do not guess a signing scheme. Obtain it from a whitelisted account or the
  SDK source, then build.
- On-chain execution + redeem: gated on the SoDEX testnet whitelist plus the signing schema.
- Live demo deploy: needs a Vercel account connected to the repo.

## Later

- Accumulated funding/flow history (the moat) + "what changed since last visit"
- Grounded AI narration of vault state and the news "why"
- Redeem flow and live position dashboard (requires an open testnet position)
- More vaults (SOL; XAUT/gold and silver as real-world-asset hedges exist on SoDEX)
- NAV/share accounting against a real deployed vault contract

## Explicitly cut

- A second offensive trading product — breadth before the one loop is proven
- Touching all three layers just to please three judge groups — depth over coverage
- Any mock/sample data fallback — gated states instead (CLAUDE.md Directive 2)
- CoinGecko/Binance price fallbacks — SoSoValue/SoDEX are the load-bearing sources
