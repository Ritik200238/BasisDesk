# Scope ledger

The wedge is one loop built deep: live data -> market-neutral quote -> deposit preview ->
reviewed receipt. The default answer to a new feature is "backlog it."

## Building now

- Live SoDEX funding -> market-neutral APR for BTC and ETH (done)
- SoSoValue ETF-flow regime -> de-risk signal on the vault (done; needs a key to light up)
- Vault detail with deposit preview + confirmation risk receipt (done)
- Wallet connect (wagmi) + wrong-network handling
- SoDEX EIP-712 order signing for execution (gated on testnet whitelist)

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
