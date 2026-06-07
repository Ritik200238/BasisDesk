import { summarizeHistory, type HistorySummary } from "./analyze";
import { getHistoryStore } from "./store";

// Read + summarize the recorded history for one asset (SoSoValue symbol, e.g. "BTC").
export async function getHistorySummary(symbol: string): Promise<HistorySummary> {
  const snapshots = await getHistoryStore().list(symbol);
  return summarizeHistory(snapshots);
}
