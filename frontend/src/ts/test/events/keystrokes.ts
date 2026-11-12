import { EventLog } from "./types";

/** Everything needed to analyse one finished test's typing later. */
export type KeystrokeRecord = {
  /**
   * typed characters, in order: `c` what was typed, `e` what the word expected
   * there, `ok` whether they matched, `t` when it was typed (ms into the test)
   */
  chars: { t: number; c: string; e?: string; ok: boolean }[];
  keydowns: { t: number; code: string }[];
  keyups: { t: number; code: string }[];
};

export function extractKeystrokes(eventLog: EventLog): KeystrokeRecord {
  const record: KeystrokeRecord = { chars: [], keydowns: [], keyups: [] };
  for (const e of eventLog.events) {
    if (e.type === "input" && e.data.inputType === "insertText") {
      const expected = eventLog.context.targetWords[e.data.wordIndex]?.[e.data.charIndex];
      record.chars.push({
        t: e.testMs,
        c: e.data.data,
        e: expected,
        ok: e.data.correct,
      });
    } else if (e.type === "keydown") {
      record.keydowns.push({ t: e.testMs, code: e.data.code });
    } else if (e.type === "keyup") {
      record.keyups.push({ t: e.testMs, code: e.data.code });
    }
  }
  return record;
}

/** A pause longer than this between two keys isn't typing speed, so it's not timed. */
const MAX_GAP_MS = 1500;
/** Fewer occurrences than this and the average is too noisy to rank. */
export const MIN_SEQUENCE_COUNT = 5;

export type SequenceStat = {
  sequence: string;
  /** windows seen */
  count: number;
  /** windows containing at least one wrong character */
  errors: number;
  errorRate: number;
  /** windows that were timed (all correct, no long pause) */
  timedCount: number;
  /** average ms between the keys of the sequence */
  avgMs: number;
};

/**
 * Counts every run of `n` consecutive letters that the words asked for, across
 * all records. Windows with spaces or punctuation are skipped.
 */
export function computeSequenceStats(records: KeystrokeRecord[], n: 2 | 3): SequenceStat[] {
  const acc = new Map<
    string,
    { count: number; errors: number; timedCount: number; totalMs: number }
  >();

  for (const record of records) {
    const chars = record.chars;
    for (let i = 0; i + n <= chars.length; i++) {
      const window = chars.slice(i, i + n);
      // the sequence is what the words asked for, so a mistake counts against it
      const seq = window.map((c) => c.e ?? c.c).join("");
      if (!/^[a-z]+$/i.test(seq)) continue;

      const key = seq.toLowerCase();
      const entry = acc.get(key) ?? {
        count: 0,
        errors: 0,
        timedCount: 0,
        totalMs: 0,
      };
      entry.count++;
      if (window.some((c) => !c.ok)) entry.errors++;

      let gapsOk = true;
      for (let j = 1; j < n; j++) {
        const gap = (window[j]?.t ?? 0) - (window[j - 1]?.t ?? 0);
        if (gap < 0 || gap > MAX_GAP_MS) gapsOk = false;
      }
      if (gapsOk && window.every((c) => c.ok)) {
        const first = window[0]?.t ?? 0;
        const last = window[n - 1]?.t ?? 0;
        entry.timedCount++;
        entry.totalMs += (last - first) / (n - 1);
      }
      acc.set(key, entry);
    }
  }

  return [...acc.entries()].map(([sequence, e]) => ({
    sequence,
    count: e.count,
    errors: e.errors,
    errorRate: e.count === 0 ? 0 : e.errors / e.count,
    timedCount: e.timedCount,
    avgMs: e.timedCount === 0 ? 0 : e.totalMs / e.timedCount,
  }));
}

/** The slowest sequences, slowest first. */
export function slowestSequences(stats: SequenceStat[], limit = 15): SequenceStat[] {
  return stats
    .filter((s) => s.timedCount >= MIN_SEQUENCE_COUNT)
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, limit);
}

/** The sequences with the highest share of mistakes, worst first. */
export function mostErrorProneSequences(stats: SequenceStat[], limit = 15): SequenceStat[] {
  return stats
    .filter((s) => s.count >= MIN_SEQUENCE_COUNT)
    .sort((a, b) => b.errorRate - a.errorRate || b.count - a.count)
    .slice(0, limit);
}

/** Running totals for one sequence, summed over any number of tests. */
export type SequenceTotals = {
  seq: string;
  count: number;
  errors: number;
  timedCount: number;
  totalMs: number;
};

export function sequenceTotals(records: KeystrokeRecord[], n: 2 | 3): SequenceTotals[] {
  return computeSequenceStats(records, n).map((s) => ({
    seq: s.sequence,
    count: s.count,
    errors: s.errors,
    timedCount: s.timedCount,
    totalMs: s.avgMs * s.timedCount,
  }));
}

/** The fastest sequences, quickest first. */
export function fastestSequences(stats: SequenceStat[], limit = 15): SequenceStat[] {
  return stats
    .filter((s) => s.timedCount >= MIN_SEQUENCE_COUNT)
    .sort((a, b) => a.avgMs - b.avgMs)
    .slice(0, limit);
}
