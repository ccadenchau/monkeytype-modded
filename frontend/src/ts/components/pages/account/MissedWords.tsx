import { createMemo, createResource, createSignal, For, JSXElement, Show } from "solid-js";

import { getMissedWordCounts, getSequenceRows } from "../../../ape/local-account";
import {
  fastestSequences,
  mostErrorProneSequences,
  SequenceStat,
  slowestSequences,
} from "../../../test/events/keystrokes";
import { Button } from "../../common/Button";

export function MissedWords(): JSXElement {
  return (
    <div class="grid gap-8">
      <MissedWordList />
      <SequenceAnalytics />
    </div>
  );
}

const MISSED_WORDS_PREVIEW = 5;
const SEQUENCE_PREVIEW = 15;

function MissedWordList(): JSXElement {
  const [words] = createResource(getMissedWordCounts);
  const [expanded, setExpanded] = createSignal(false);

  return (
    <div class="grid gap-4 rounded bg-sub-alt p-4">
      <div class="text-sub">
        Words you mistyped, and in how many tests. Saved in this browser only.
      </div>
      <Show when={words()} fallback={<div class="text-sub">Loading...</div>}>
        {(list) => (
          <Show
            when={list().length > 0}
            fallback={<div class="text-sub">No missed words yet.</div>}
          >
            <div class="grid grid-cols-[minmax(0,1fr)_4rem] gap-x-4 gap-y-1 text-sm">
              <div class="text-sub">word</div>
              <div class="text-right text-sub">tests</div>
              <For each={expanded() ? list() : list().slice(0, MISSED_WORDS_PREVIEW)}>
                {(item) => (
                  <>
                    <div class="truncate">{item.word}</div>
                    <div class="text-right">{item.count}</div>
                  </>
                )}
              </For>
            </div>
            <Show when={list().length > MISSED_WORDS_PREVIEW}>
              <Button
                text={expanded() ? "show less" : "show more"}
                class="w-full"
                onClick={() => setExpanded(!expanded())}
              />
            </Show>
          </Show>
        )}
      </Show>
    </div>
  );
}

function SequenceAnalytics(): JSXElement {
  const [rows] = createResource(getSequenceRows);
  const [length, setLength] = createSignal<2 | 3>(2);
  const [expanded, setExpanded] = createSignal(false);

  const stats = createMemo((): SequenceStat[] | undefined => {
    const all = rows();
    if (all === undefined) return undefined;
    return all
      .filter((r) => r.n === length())
      .map((r) => ({
        sequence: r.seq,
        count: r.count,
        errors: r.errors,
        errorRate: r.count === 0 ? 0 : r.errors / r.count,
        timedCount: r.timedCount,
        avgMs: r.timedCount === 0 ? 0 : r.totalMs / r.timedCount,
      }));
  });

  const overall = createMemo(() => {
    const list = stats() ?? [];
    const count = list.reduce((sum, s) => sum + s.count, 0);
    const errors = list.reduce((sum, s) => sum + s.errors, 0);
    const timed = list.reduce((sum, s) => sum + s.timedCount, 0);
    const totalMs = list.reduce((sum, s) => sum + s.avgMs * s.timedCount, 0);
    return {
      sequences: list.length,
      avgMs: timed === 0 ? undefined : totalMs / timed,
      errorRate: count === 0 ? undefined : errors / count,
    };
  });

  const allSlowest = createMemo(() =>
    stats() ? slowestSequences(stats() as SequenceStat[], Infinity) : [],
  );
  const allFastest = createMemo(() =>
    stats() ? fastestSequences(stats() as SequenceStat[], Infinity) : [],
  );
  const allErrorProne = createMemo(() =>
    stats() ? mostErrorProneSequences(stats() as SequenceStat[], Infinity) : [],
  );
  const shown = (list: SequenceStat[]): SequenceStat[] =>
    expanded() ? list : list.slice(0, SEQUENCE_PREVIEW);
  const hasMore = (): boolean =>
    [allSlowest(), allFastest(), allErrorProne()].some((list) => list.length > SEQUENCE_PREVIEW);

  return (
    <div class="grid gap-4 rounded bg-sub-alt p-4">
      <div class="flex items-center justify-between gap-4">
        <div class="text-sub">
          Letter sequences from your typing, totalled over every finished test in this browser.
        </div>
        <div class="flex gap-2">
          <Button
            text="2 letters"
            class={`${length() === 2 ? "bg-main text-bg" : "bg-sub-alt text-sub"}`}
            onClick={() => setLength(2)}
          />
          <Button
            text="3 letters"
            class={`${length() === 3 ? "bg-main text-bg" : "bg-sub-alt text-sub"}`}
            onClick={() => setLength(3)}
          />
        </div>
      </div>
      <Show when={stats()} fallback={<div class="text-sub">Loading...</div>}>
        <div class="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <div>
            <span class="text-sub">average gap: </span>
            {overall().avgMs === undefined ? "–" : `${Math.round(overall().avgMs as number)} ms`}
          </div>
          <div>
            <span class="text-sub">error rate: </span>
            {overall().errorRate === undefined
              ? "–"
              : `${Math.round((overall().errorRate as number) * 100)}%`}
          </div>
          <div>
            <span class="text-sub">sequences: </span>
            {overall().sequences}
          </div>
        </div>
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <SequenceTable
            title="fastest"
            rows={shown(allFastest())}
            value={(s) => `${Math.round(s.avgMs)} ms`}
            detail={(s) => `${s.timedCount}`}
          />
          <SequenceTable
            title="slowest"
            rows={shown(allSlowest())}
            value={(s) => `${Math.round(s.avgMs)} ms`}
            detail={(s) => `${s.timedCount}`}
          />
          <SequenceTable
            title="most error-prone"
            rows={shown(allErrorProne())}
            value={(s) => `${Math.round(s.errorRate * 100)}%`}
            detail={(s) => `${s.errors} of ${s.count}`}
          />
        </div>
        <Show when={hasMore()}>
          <Button
            text={expanded() ? "show less" : "show more"}
            class="w-full"
            onClick={() => setExpanded(!expanded())}
          />
        </Show>
      </Show>
    </div>
  );
}

function SequenceTable(props: {
  title: string;
  rows: SequenceStat[];
  value: (s: SequenceStat) => string;
  detail: (s: SequenceStat) => string;
}): JSXElement {
  return (
    <div class="grid gap-2">
      <div class="text-sub">{props.title}</div>
      <Show
        when={props.rows.length > 0}
        fallback={<div class="text-sub">Not enough data yet.</div>}
      >
        <div class="grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-4 gap-y-1 text-sm">
          <div class="text-sub">sequence</div>
          <div class="text-right text-sub">value</div>
          <div class="text-right text-sub">samples</div>
          <For each={props.rows}>
            {(s) => (
              <>
                <div class="truncate">{s.sequence}</div>
                <div class="text-right">{props.value(s)}</div>
                <div class="text-right text-sub">{props.detail(s)}</div>
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
