import { DBSchema, IDBPDatabase, openDB } from "idb";
import type { CompletedEvent } from "@monkeytype/schemas/results";
import type { PersonalBests } from "@monkeytype/schemas/shared";
import type { CustomTheme } from "@monkeytype/schemas/users";
import { KeystrokeRecord, sequenceTotals, SequenceTotals } from "../test/events/keystrokes";

/**
 * The single account this browser uses. Every browser has its own, since the
 * data lives in this browser's IndexedDB and nowhere else.
 */
// ids in results must match the token pattern [a-zA-Z0-9_]
export const LOCAL_ACCOUNT_UID = "local_account";

export type LocalUser = {
  name: string;
  addedAt: number;
  personalBests: PersonalBests;
  completedTests: number;
  startedTests: number;
  timeTyping: number;
  customThemes?: CustomTheme[];
};

export type StoredResult = CompletedEvent & { _id: string; isPb: boolean };

type LocalDB = DBSchema & {
  results: {
    key: string;
    value: StoredResult;
    indexes: { timestamp: number };
  };
  meta: {
    key: string;
    value: LocalUser;
  };
  missedWords: {
    key: string;
    value: { word: string; count: number };
  };
  keystrokes: {
    key: number;
    value: KeystrokeRecord;
  };
  sequences: {
    key: string;
    value: SequenceRow;
    indexes: { n: number };
  };
  flags: {
    key: string;
    value: boolean;
  };
};

/** Running totals for one 2- or 3-letter sequence. Key is `${n}:${seq}`. */
export type SequenceRow = SequenceTotals & { key: string; n: 2 | 3 };

const DB_NAME = "monkeytype-local-account";
const DB_VERSION = 4;
const USER_KEY = "user";

let dbPromise: Promise<IDBPDatabase<LocalDB>> | undefined;

async function getDb(): Promise<IDBPDatabase<LocalDB>> {
  dbPromise ??= openDB<LocalDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const results = db.createObjectStore("results", { keyPath: "_id" });
        results.createIndex("timestamp", "timestamp");
        db.createObjectStore("meta");
      }
      if (oldVersion < 2) {
        db.createObjectStore("missedWords", { keyPath: "word" });
      }
      if (oldVersion < 3) {
        db.createObjectStore("keystrokes", { autoIncrement: true });
      }
      if (oldVersion < 4) {
        const sequences = db.createObjectStore("sequences", { keyPath: "key" });
        sequences.createIndex("n", "n");
        db.createObjectStore("flags");
      }
    },
  });
  return dbPromise;
}

export function emptyPersonalBests(): PersonalBests {
  return { time: {}, words: {}, quote: {}, zen: {}, custom: {} };
}

/** The local account, created on first read. */
export async function getLocalUser(): Promise<LocalUser> {
  const db = await getDb();
  const existing = await db.get("meta", USER_KEY);
  if (existing !== undefined) return existing;

  const fresh: LocalUser = {
    name: "local",
    addedAt: Date.now(),
    personalBests: emptyPersonalBests(),
    completedTests: 0,
    startedTests: 0,
    timeTyping: 0,
  };
  await db.put("meta", fresh, USER_KEY);
  return fresh;
}

export async function putLocalUser(user: LocalUser): Promise<void> {
  const db = await getDb();
  await db.put("meta", user, USER_KEY);
}

/** Stores a result and the updated account in one transaction. */
export async function storeResultAndUser(result: StoredResult, user: LocalUser): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["results", "meta"], "readwrite");
  await Promise.all([
    tx.objectStore("results").put(result),
    tx.objectStore("meta").put(user, USER_KEY),
    tx.done,
  ]);
}

/** All stored results, newest first. */
export async function getStoredResults(): Promise<StoredResult[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("results", "timestamp");
  return all.reverse();
}

export async function getStoredResult(id: string): Promise<StoredResult | undefined> {
  const db = await getDb();
  return db.get("results", id);
}

/**
 * Adds one miss to each word, once per test. Saved only; nothing reads it yet.
 */
export async function addMissedWords(words: string[]): Promise<void> {
  if (words.length === 0) return;
  const db = await getDb();
  const tx = db.transaction("missedWords", "readwrite");
  for (const word of words) {
    const existing = await tx.store.get(word);
    await tx.store.put({ word, count: (existing?.count ?? 0) + 1 });
  }
  await tx.done;
}

/** All missed words, most missed first. */
export async function getMissedWordCounts(): Promise<{ word: string; count: number }[]> {
  const db = await getDb();
  const all = await db.getAll("missedWords");
  return all.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

/** Keeps one finished test's keystrokes, for the sequence analytics. */
export async function addKeystrokes(record: KeystrokeRecord): Promise<void> {
  const db = await getDb();
  await db.add("keystrokes", record);
}

export async function getAllKeystrokes(): Promise<KeystrokeRecord[]> {
  const db = await getDb();
  return db.getAll("keystrokes");
}

const BACKFILL_FLAG = "sequencesBackfilled";
let backfill: Promise<void> | undefined;

/** Adds the given tests' sequence totals to the stored ones. */
async function addSequenceTotals(records: KeystrokeRecord[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("sequences", "readwrite");
  for (const n of [2, 3] as const) {
    for (const t of sequenceTotals(records, n)) {
      const key = `${n}:${t.seq}`;
      const existing = await tx.store.get(key);
      await tx.store.put({
        key,
        n,
        seq: t.seq,
        count: (existing?.count ?? 0) + t.count,
        errors: (existing?.errors ?? 0) + t.errors,
        timedCount: (existing?.timedCount ?? 0) + t.timedCount,
        totalMs: (existing?.totalMs ?? 0) + t.totalMs,
      });
    }
  }
  await tx.done;
}

/**
 * Tests finished before sequence totals existed are added once, from their
 * stored keystrokes.
 */
async function ensureSequencesBackfilled(): Promise<void> {
  backfill ??= (async () => {
    const db = await getDb();
    if (await db.get("flags", BACKFILL_FLAG)) return;
    const all = await db.getAll("keystrokes");
    await addSequenceTotals(all);
    await db.put("flags", true, BACKFILL_FLAG);
  })();
  return backfill;
}

/**
 * Saves a finished test: its keystrokes, and its totals for every 2- and
 * 3-letter sequence.
 */
export async function saveFinishedTest(record: KeystrokeRecord): Promise<void> {
  await ensureSequencesBackfilled();
  await addSequenceTotals([record]);
  await addKeystrokes(record);
}

/** Running totals for every 2- and 3-letter sequence typed so far. */
export async function getSequenceRows(): Promise<SequenceRow[]> {
  await ensureSequencesBackfilled();
  const db = await getDb();
  return db.getAll("sequences");
}

/** One finished test's speed, for graphing over time. */
export type SpeedPoint = { timestamp: number; wpm: number; raw: number };

/**
 * Average and raw speed of every test, grouped by test type (e.g. "time-15",
 * "words-25"), each series oldest first.
 */
export async function getSpeedStreams(): Promise<Record<string, SpeedPoint[]>> {
  const results = await getStoredResults();
  const streams: Record<string, SpeedPoint[]> = {};
  const oldestFirst = [...results].sort((a, b) => a.timestamp - b.timestamp);
  for (const r of oldestFirst) {
    const key = `${r.mode}-${r.mode2}`;
    (streams[key] ??= []).push({
      timestamp: r.timestamp,
      wpm: r.wpm,
      raw: r.rawWpm,
    });
  }
  return streams;
}
