import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { list, put } from "@vercel/blob";
import type { HistoryStore, Snapshot } from "./types";

const HISTORY_PATHNAME = "history.json";
const MAX_SNAPSHOTS = 4000; // cap so the single blob stays small (years of daily snapshots)

// Durable store backed by Vercel Blob. One public JSON file holds all snapshots; record() appends
// with read-modify-write (the only writer is the daily cron, so there is no concurrency). Reads
// resolve the blob via list() then fetch it. Used whenever BLOB_READ_WRITE_TOKEN is set.
class BlobHistoryStore implements HistoryStore {
  constructor(private readonly token: string) {}

  private async readAll(): Promise<Snapshot[]> {
    try {
      const { blobs } = await list({ prefix: HISTORY_PATHNAME, token: this.token });
      const b = blobs.find((x) => x.pathname === HISTORY_PATHNAME);
      if (!b) return [];
      const res = await fetch(b.url, { cache: "no-store" });
      if (!res.ok) return [];
      const parsed = await res.json();
      return Array.isArray(parsed) ? (parsed as Snapshot[]) : [];
    } catch {
      return [];
    }
  }

  async record(snapshot: Snapshot): Promise<void> {
    const all = await this.readAll();
    all.push(snapshot);
    const trimmed = all.length > MAX_SNAPSHOTS ? all.slice(all.length - MAX_SNAPSHOTS) : all;
    await put(HISTORY_PATHNAME, JSON.stringify(trimmed), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: this.token,
    });
  }

  async list(symbol: string, sinceMs?: number): Promise<Snapshot[]> {
    const all = await this.readAll();
    return all.filter((s) => s.symbol === symbol && (sinceMs == null || s.ts >= sinceMs));
  }
}

// Fallback store: a JSON file in the OS temp dir. Works locally; on Vercel it is ephemeral per
// instance (no durable history). Used only when no Blob token is configured.
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
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (blobToken) {
      store = new BlobHistoryStore(blobToken);
    } else {
      const file =
        process.env.HISTORY_FILE?.trim() || path.join(os.tmpdir(), "basisdesk-history.json");
      store = new FileHistoryStore(file);
    }
  }
  return store;
}
