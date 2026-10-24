import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

/**
 * Persistence for the booking engine: one JSON document.
 *
 * - On Vercel (BLOB_READ_WRITE_TOKEN set) it lives in a private Vercel Blob and
 *   every write is conditional on the ETag that was read, so two simultaneous
 *   bookings can never overwrite each other — the loser retries on fresh data.
 * - Locally it is a JSON file (./data/reservations.json or RESERVATIONS_FILE).
 */

export class StaleWriteError extends Error {}

export interface Snapshot<T> {
  data: T | null;
  version?: string;
}

const BLOB_PATH = "fogo-ventura/reservations.json";
const FILE = process.env.RESERVATIONS_FILE || path.join(process.cwd(), "data", "reservations.json");
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function readDoc<T>(): Promise<Snapshot<T>> {
  if (useBlob()) {
    const res = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return { data: null };
    const text = await new Response(res.stream).text();
    return { data: JSON.parse(text) as T, version: res.blob.etag };
  }
  try {
    return { data: JSON.parse(await fs.readFile(FILE, "utf8")) as T };
  } catch {
    return { data: null };
  }
}

export async function writeDoc<T>(data: T, version?: string): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  if (useBlob()) {
    try {
      await put(BLOB_PATH, body, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        // First write must create; later writes must match what we read.
        allowOverwrite: Boolean(version),
        ifMatch: version,
        cacheControlMaxAge: 60,
      });
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) throw new StaleWriteError();
      // Creating a doc that another request created first also means "stale".
      if (!version && err instanceof Error && /already exists/i.test(err.message)) throw new StaleWriteError();
      throw err;
    }
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, FILE);
}
