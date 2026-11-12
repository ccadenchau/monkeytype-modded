import { createMemo, createResource, createSignal, For, JSXElement, Show } from "solid-js";

import { getSpeedStreams } from "../../../ape/local-account";
import { getTheme } from "../../../states/theme";
import { Button } from "../../common/Button";
import { ChartJs } from "../../common/ChartJs";

const testTypes = [
  { key: "time-15", label: "15 seconds" },
  { key: "time-30", label: "30 seconds" },
  { key: "time-60", label: "60 seconds" },
  { key: "time-120", label: "120 seconds" },
  { key: "words-10", label: "10 words" },
  { key: "words-25", label: "25 words" },
  { key: "words-50", label: "50 words" },
  { key: "words-100", label: "100 words" },
] as const;

export function SpeedChart(): JSXElement {
  const [streams] = createResource(getSpeedStreams);
  const [selected, setSelected] = createSignal<string>(testTypes[0].key);

  const points = createMemo(() => streams()?.[selected()] ?? []);

  return (
    <div class="grid gap-4 rounded bg-sub-alt p-4">
      <div class="flex flex-wrap gap-2">
        <For each={testTypes}>
          {(t) => (
            <Button
              text={t.label}
              class={selected() === t.key ? "bg-main text-bg" : "bg-sub-alt text-sub"}
              onClick={() => setSelected(t.key)}
            />
          )}
        </For>
      </div>
      <Show when={streams()} fallback={<div class="text-sub">Loading...</div>}>
        <Show
          when={points().length > 0}
          fallback={<div class="text-sub">No tests of this type yet.</div>}
        >
          <div class="h-96 w-full">
            <ChartJs
              name="SpeedOverTime"
              type="line"
              data={{
                datasets: [
                  {
                    label: "wpm",
                    data: points().map((p, i) => ({ x: i, y: p.wpm })),
                    borderColor: getTheme().main,
                    backgroundColor: getTheme().main,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    borderWidth: 2,
                  },
                  {
                    label: "raw",
                    data: points().map((p, i) => ({ x: i, y: p.raw })),
                    borderColor: getTheme().sub,
                    backgroundColor: getTheme().sub,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    borderWidth: 2,
                    borderDash: [4, 4],
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                interaction: {
                  mode: "nearest",
                  axis: "x",
                  intersect: false,
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: (items) => `test ${(items[0]?.parsed.x ?? 0) + 1}`,
                    },
                  },
                },
                scales: {
                  x: {
                    type: "linear",
                    display: false,
                    grid: { display: false },
                  },
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "wpm" },
                  },
                },
              }}
            />
          </div>
        </Show>
      </Show>
    </div>
  );
}
