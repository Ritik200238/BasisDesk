import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { HistoryStore, Snapshot } from "./types";

// Default store: a JSON file. Writes to the OS temp dir so it works locally and on a writable
// serverless filesystem; on Vercel that is ephemeral per instance. For durable history set
// HISTORY_FILE to a persistent path, or replace this with a Postgres/KV implementation — the
// HistoryStore interface keeps callers unchanged.
class FileHistoryStore implements HistoryStore {
  constructor(private readonly file: string) {}

  private async readAll(): Promise<Snapshot[]> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Snapshot[]) : [];
    } catch {
      return [];
    }
  }

  async record(snapshot: Snapshot): Promise<void> {
    const all = await this.readAll();
    all.push(snapshot);
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(all), "utf8");
  }

  async list(symbol: string, sinceMs?: number): Promise<Snapshot[]> {
    const all = await this.readAll();
    return all.filter((s) => s.symbol === symbol && (sinceMs == null || s.ts >= sinceMs));
  }
}

let store: HistoryStore | null = null;

export function getHistoryStore(): HistoryStore {
  if (!store) {
    const file =
      process.env.HISTORY_FILE?.trim() || path.join(os.tmpdir(), "basisdesk-history.json");
    store = new FileHistoryStore(file);
  }
  return store;
}
