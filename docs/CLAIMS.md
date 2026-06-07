# Data lineage ledger

Every user-facing number maps to the exact upstream and code path that produces it. A claim
with no backing row must not appear in the UI. Updating this is part of finishing a feature.

| Claim (UI) | Upstream | Endpoint | Code path |
| --- | --- | --- | --- |
| Funding APR (annualized, live) | SoDEX | GET /markets/mark-prices (fundingRate) | `lib/sodex/markets.getMarkPrice` -> `lib/vault/quote.buildVaultQuote` (`lib/core/funding.fundingApr`) |
| Net on capital at Nx | derived | — | `lib/core/funding.fundingYieldOnCapital` |
| Mark price | SoDEX | GET /markets/mark-prices (markPrice) | `lib/sodex/markets.getMarkPrice` |
| Short liquidation room / price | SoDEX spec + core | GET /markets/symbols (marginTiers) | `lib/core/risk.shortLiquidationDistance`, `shortLiquidationPrice` |
| Maintenance margin | SoDEX | GET /markets/symbols (marginTiers[0].maintenanceMarginRate) | `lib/vault/quote.buildVaultQuote` |
| Taker fee / entry fees | SoDEX | GET /markets/symbols (takerFee) | `lib/vault/preview.computeDepositPreview` |
| Next funding (in Xm) | SoDEX | GET /markets/mark-prices (nextFundingTime) | `components/vault/VaultQuoteCard.minutesUntil` |
| Risk badge (calm/watch/derisk) | core + SoSoValue | — | `lib/core/risk.classifyRisk` + `lib/flows/regime.escalateForFlow` |
| Institutional flow regime / streak | SoSoValue | GET /etfs/summary-history (total_net_inflow) | `lib/flows/regime.computeFlowRegime` |
| Latest net inflow / AUM | SoSoValue | GET /etfs/summary-history (total_net_inflow, total_net_assets) | `lib/flows/regime.computeFlowRegime` |
| Deposit preview (qty, margin, fees, delta) | core | — | `lib/vault/preview.computeDepositPreview` |

## Verification status

- SoDEX market-data shapes were confirmed by probing the live testnet gateway (the published
  docs were partly stale: `fundingRate` not `estimatedFundingRate`, markets keyed by `name`).
- SoDEX positions/fundings shapes are doc-derived; re-verify once a whitelisted testnet account
  is available.
- SoSoValue ETF summary-history params/fields are confirmed from the docs; verify the response
  envelope and news shape with a live key.
