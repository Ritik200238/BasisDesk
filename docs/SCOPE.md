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
- SoDEX EIP-712 order signing, ported and verified from the public Go SDK (canonical JSON +
  sign-to-recover round-trip); the wallet's signTypedData produces the identical digest, so
  signing is non-custodial

## Verified

- Production build is green and all routes render in a consistently-cased checkout (mirrors the
  Linux deploy environment). A mixed-case Windows folder path is the only env that loads React
  twice; a normal clone or Vercel is unaffected.

## Blocked (needs external access)

- Order submission + redeem: the signing is built and verified; submitting the signed order
  (POST with X-API-Key / X-API-Sign / X-API-Nonce, plus the account id and nonce from the user's
  SoDEX account) needs a whitelisted testnet account. The signed wire signature is ready to attach.
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
