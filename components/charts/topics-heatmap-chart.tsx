"use client";

import { useEffect, useMemo, useState } from "react";

import type { EChartsOption } from "echarts";

import {
  buildTooltip,
  tooltipChrome,
} from "@/lib/charts/tooltip";
import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { formatNumber } from "@/lib/format";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";
import { useTheme } from "@/lib/hooks/use-theme";
import type { TopicsHeatmapPayload } from "@/lib/types";

import { useChartExport } from "@/lib/charts/use-chart-export";

import { EChart } from "./echart";
import { ExportMenu } from "./export-menu";
import { TopNField } from "./top-n-field";


/** The sequential ramp, read from the design tokens rather than hardcoded. */
function rampFor(): string[] {
  const fallback = ["#7ecfcd", "#00a4bf", "#2563eb", "#223da2"];
  if (typeof window === "undefined") return fallback;
  const styles = getComputedStyle(document.documentElement);
  const stops = [0, 2, 4, 6]
    .map((index) => styles.getPropertyValue(`--viz-seq-${index}`).trim())
    .filter(Boolean);
  return stops.length === 4 ? stops : fallback;
}

export function TopicsHeatmapChart({
  defaultTopN = 100,
}: {
  defaultTopN?: number;
}) {
  const [payload, setPayload] = useState<TopicsHeatmapPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topN, setTopN] = useState(defaultTopN);
  const tokens = useChartTokens();
  const theme = useTheme();
  const ramp = useMemo(() => rampFor(), [theme]);

  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("topicsHeatmap"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<TopicsHeatmapPayload>;
      })
      .then((data) => !cancelled && setPayload(data))
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unknown error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A fixed grid gutter is wider than the whole chart box on a phone.
  const [width, setWidth] = useState(0);
  const gutter =
    width > 0 ? Math.max(72, Math.min(210, width * 0.34)) : 210;

  const { chartRef, onExport } = useChartExport(
    "topics-heatmap",
    () => {
      // One row per non-zero cell: a wide matrix as CSV columns is unusable
      // in a spreadsheet, and most of the grid is empty anyway.
      const topicCount = Math.min(topN, payload?.topics.length ?? 0);
      const rows: (string | number)[][] = [];
      payload?.matrix.forEach((row, y) => {
        row.slice(0, topicCount).forEach((count, x) => {
          if (count > 0) {
            rows.push([payload.sub_categories[y], payload.topics[x], count]);
          }
        });
      });
      return { columns: ["sub_category", "topic", "projects"], rows };
    },
    [`top-${topN}`],
  );

  const option: EChartsOption = useMemo(() => {
    if (!payload) return {};
    const topicCount = Math.min(topN, payload.topics.length);
    const topics = payload.topics.slice(0, topicCount);
    const matrix = payload.matrix.map((row) => row.slice(0, topicCount));
    const logMatrix = payload.log10_matrix.map((row) =>
      row.slice(0, topicCount),
    );

    const data: [number, number, number][] = [];
    let max = 0;
    for (let y = 0; y < logMatrix.length; y += 1) {
      for (let x = 0; x < topicCount; x += 1) {
        const value = logMatrix[y][x] ?? 0;
        if (value > 0) {
          data.push([x, y, value]);
          if (value > max) max = value;
        }
      }
    }

    return {
      grid: { left: gutter + 16, right: 24, top: 12, bottom: 90 },
      tooltip: {
        ...tooltipChrome(tokens),
        formatter: (params: unknown) => {
          const point = params as { value?: [number, number, number] };
          const [x, y] = point.value ?? [0, 0, 0];
          return buildTooltip(tokens, {
            title: topics[x] ?? "",
            subtitle: payload.sub_categories[y] ?? "",
            rows: [
              {
                label: "Projects mentioning it",
                value: formatNumber(matrix[y]?.[x] ?? 0),
                strong: true,
              },
            ],
          });
        },
      },
      xAxis: {
        type: "category",
        data: topics,
        axisLabel: { rotate: 60, color: tokens.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: tokens.border } },
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: payload.sub_categories,
        axisLabel: { width: 190, overflow: "truncate", color: tokens.ink },
        axisLine: { lineStyle: { color: tokens.border } },
        splitArea: { show: false },
      },
      visualMap: {
        min: 0,
        max: max || 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 8,
        textStyle: { color: tokens.muted },
        inRange: { color: ramp },
      },
      series: [
        {
          type: "heatmap",
          data,
          progressive: 2000,
          itemStyle: { borderWidth: 0 },
          emphasis: {
            itemStyle: {
              borderColor: tokens.inkStrong,
              borderWidth: 1,
            },
          },
        },
      ],
    };
  }, [payload, topN, tokens, ramp, gutter]);

  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>The topics heatmap could not be loaded ({error}).</p>
      </div>
    );
  }

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          {/* Its own list was labelled "Topics" where every other chart says
              "Show", and stopped at 400 of the 500 topics. */}
          <TopNField
            value={topN}
            onChange={setTopN}
            max={payload?.topics.length ?? 0}
            noun="topics"
          />
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      {!payload ? (
        <div className="viz-state" aria-busy="true" aria-live="polite">
          <p className="viz-state__label">Loading the topic matrix…</p>
        </div>
      ) : (
        <EChart
          instanceRef={chartRef}
          onWidth={setWidth}
        label={`Heatmap: how often each of the top ${topN} topics appears in each sub-category`}
          option={option}
          height={Math.max(560, payload.sub_categories.length * 14 + 220)}
        />
      )}
    </div>
  );
}
