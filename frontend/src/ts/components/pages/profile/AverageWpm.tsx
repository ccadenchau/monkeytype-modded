import { JSXElement, createMemo, For } from "solid-js";

import {
  createResultsQueryState,
  NormalizedLocalResult,
  useResultsLiveQuery,
} from "../../../collections/results";
import defaultResultFilters from "../../../constants/default-result-filters";
import { getFormatting } from "../../../states/core";

const timeModes = ["15", "30", "60", "120"] as const;
const wordModes = ["10", "25", "50", "100"] as const;

// all results, whatever the account page filters are set to
const allResultsState = createResultsQueryState(defaultResultFilters);

/** Average wpm of every saved test with this mode and length. */
function averageFor(
  results: readonly NormalizedLocalResult<"time" | "words">[],
  mode: "time" | "words",
  mode2: string,
): { average: number | undefined; rawAverage: number | undefined; count: number } {
  let sum = 0;
  let rawSum = 0;
  let count = 0;
  for (const result of results) {
    if (result.mode !== mode || result.mode2 !== mode2) continue;
    sum += result.wpm;
    rawSum += result.rawWpm;
    count++;
  }
  return {
    average: count === 0 ? undefined : sum / count,
    rawAverage: count === 0 ? undefined : rawSum / count,
    count,
  };
}

export function AverageWpm(): JSXElement {
  const format = getFormatting;

  const resultsQuery = useResultsLiveQuery({
    queryState: () => allResultsState,
    sorting: () => ({ field: "timestamp", direction: "desc" }),
    limit: () => 1_000_000,
  });

  const cards = createMemo(() => {
    const results = (resultsQuery() ?? []) as NormalizedLocalResult<"time" | "words">[];
    return [
      {
        label: "seconds",
        mode: "time" as const,
        items: timeModes.map((mode2) => ({
          mode2,
          ...averageFor(results, "time", mode2),
        })),
      },
      {
        label: "words",
        mode: "words" as const,
        items: wordModes.map((mode2) => ({
          mode2,
          ...averageFor(results, "words", mode2),
        })),
      },
    ];
  });

  return (
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <For each={cards()}>
        {(card) => (
          <div class="rounded bg-sub-alt p-4">
            <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
              <For each={card.items}>
                {(item) => (
                  <div class="grid items-center text-center">
                    <div class="text-xs text-sub">
                      {item.mode2} {card.label}
                    </div>
                    <div class="text-4xl">
                      {format().typingSpeed(item.average, {
                        showDecimalPlaces: false,
                      })}
                    </div>
                    <div class="text-xs text-sub">
                      raw{" "}
                      {format().typingSpeed(item.rawAverage, {
                        showDecimalPlaces: false,
                      })}
                    </div>
                    <div class="text-xs text-sub">
                      {item.count} {item.count === 1 ? "test" : "tests"}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
