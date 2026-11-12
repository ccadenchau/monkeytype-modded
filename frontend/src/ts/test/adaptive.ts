import { getMissedWordCounts, getSequenceRows } from "../ape/local-account";
import { setConfig } from "../config/setters";
import { getConfig } from "../config/store";
import { createSignal } from "solid-js";
import { getCurrentLanguage } from "../utils/json-data";
import { setLimitMode, setLimitValue, setText } from "./custom-text";

/** Whether the current custom test was started with Adaptive. */
const ADAPTIVE_KEY = "adaptiveActive";

function readStoredAdaptive(): boolean {
  try {
    return localStorage.getItem(ADAPTIVE_KEY) === "true";
  } catch {
    return false;
  }
}

const [adaptive, setAdaptive] = createSignal(readStoredAdaptive());

/** Whether the test is an adaptive one. Remembered across reloads. */
export const isAdaptiveActive = adaptive;

export function setAdaptiveActive(active: boolean): void {
  setAdaptive(active);
  try {
    localStorage.setItem(ADAPTIVE_KEY, String(active));
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}

/** How many words an adaptive test contains. */
export const ADAPTIVE_WORD_COUNT = 50;
/** Sequences with fewer samples than this don't count as weak. */
const MIN_SAMPLES = 5;

/**
 * How weak each letter pair is, from 0 up. Mistakes count double; slowness
 * counts relative to your overall average pace.
 */
export function weakPairScores(
  rows: { seq: string; count: number; errors: number; timedCount: number; totalMs: number }[],
): Map<string, number> {
  const pairs = rows.filter((r) => r.count >= MIN_SAMPLES);
  const timed = pairs.reduce((sum, r) => sum + r.timedCount, 0);
  const totalMs = pairs.reduce((sum, r) => sum + r.totalMs, 0);
  const overallMs = timed === 0 ? 0 : totalMs / timed;

  const scores = new Map<string, number>();
  for (const r of pairs) {
    const errorRate = r.errors / r.count;
    const avgMs = r.timedCount === 0 ? overallMs : r.totalMs / r.timedCount;
    const slowness = overallMs === 0 ? 0 : Math.max(0, (avgMs - overallMs) / overallMs);
    scores.set(r.seq, errorRate * 2 + slowness);
  }
  return scores;
}

/**
 * Picks words from the current language, weighted toward the letter pairs you
 * are slow or error-prone on, and toward words you have mistyped.
 */
export async function buildAdaptiveWords(count = ADAPTIVE_WORD_COUNT): Promise<string[]> {
  const language = await getCurrentLanguage(getConfig.language);
  const candidates = language.words.filter((w) => /^[a-z]+$/i.test(w));

  const pairScores = weakPairScores((await getSequenceRows()).filter((r) => r.n === 2));
  const missed = new Map((await getMissedWordCounts()).map((m) => [m.word.toLowerCase(), m.count]));

  const weights = candidates.map((word) => {
    const lower = word.toLowerCase();
    let weight = 0.05;
    for (let i = 0; i + 1 < lower.length; i++) {
      weight += pairScores.get(lower.slice(i, i + 2)) ?? 0;
    }
    weight += (missed.get(lower) ?? 0) * 2;
    return weight;
  });

  const total = weights.reduce((sum, w) => sum + w, 0);
  const picked: string[] = [];
  for (let n = 0; n < count && candidates.length > 0; n++) {
    let roll = Math.random() * total;
    let index = 0;
    for (; index < weights.length - 1; index++) {
      roll -= weights[index] ?? 0;
      if (roll < 0) break;
    }
    picked.push(candidates[index] ?? candidates[0] ?? "");
  }
  return picked;
}

/** Fills the custom text with a fresh adaptive word list. */
export async function applyAdaptiveWords(): Promise<void> {
  const words = await buildAdaptiveWords();
  setText(words);
  setLimitMode("word");
  setLimitValue(words.length);
  if (getConfig.mode !== "custom") setConfig("mode", "custom");
}
