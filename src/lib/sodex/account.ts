// Address-keyed SoDEX perps account reads. These public reads take only a public EVM
// address (no signing). A live trading account additionally requires the testnet whitelist;
// without it these return empty/anonymous data, which callers render as an explicit state.

import { perpsUrl } from "./config";
import { getJson, type SodexResult } from "./http";
import {
  accountStateSchema,
  fundingsSchema,
  positionsDataSchema,
  type AccountState,
  type FundingEventRaw,
  type PerpPosition,
} from "./schemas";

// GET /accounts/{address}/state — resolves the SoDEX account id (aid) for any address. Reading
// it needs no whitelist; trading with it still requires a funded, whitelisted account.
export function getAccountState(address: string): Promise<SodexResult<AccountState>> {
  return getJson(perpsUrl(`/accounts/${address}/state`), accountStateSchema);
}

// GET /accounts/{address}/positions — open perp positions incl. liquidation price.
export async function getPositions(address: string): Promise<SodexResult<PerpPosition[]>> {
  const res = await getJson(perpsUrl(`/accounts/${address}/positions`), positionsDataSchema);
  if (!res.ok) return res;
  return { ok: true, data: res.data.positions, asOf: res.asOf };
}

// GET /accounts/{address}/fundings — realized funding history (the actual yield received).
export function getFundingHistory(
  address: string,
  params?: { symbol?: string; limit?: number; startTime?: number; endTime?: number },
): Promise<SodexResult<FundingEventRaw[]>> {
  return getJson(perpsUrl(`/accounts/${address}/fundings`, params), fundingsSchema);
}
