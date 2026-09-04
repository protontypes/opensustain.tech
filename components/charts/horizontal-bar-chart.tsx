"use client";

import { useMemo, useRef, useState } from "react";

import type { EChartsOption } from "echarts";

import {
  downloadBlob,
  echartPngBlob,
  exportFilename,
  toCsvBlob,
  type CsvValue,
} from "@/lib/charts/export";
import {
  buildTooltip,
  tooltipChrome,
  type TooltipRow,
} from "@/lib/charts/tooltip";
import { formatNumber } from "@/lib/format";
import { useChartTokens, type ChartTokens } from "@/lib/hooks/use-chart-tokens";
import { useTheme } from "@/lib/hooks/use-theme";

import { EChart, type EChartHandle } from "./echart";
import { ExportMenu } from "./export-menu";

export type BarDatum = {
  /** Stable identity — the label is not unique across every dataset. */
  key: string;
  label: string;
  value: number;
  subtitle?: string;
  /** Extra tooltip rows beyond the value itself. */
  rows?: TooltipRow[];
  /** Opens in a new tab on click. */
  href?: string;
};

/** The seven-stop sequential ramp, resolved per theme. */
function sequentialRamp(): string[] {
  if (typeof window === "undefined") return [];
  const styles = getComputedStyle(document.documentElement);
  return Array.from({ length: 7 }, (_, index) =>
    styles.getPropertyValue(`--viz-seq-${index}`).trim(),
  ).filter(Boolean);
}

export type BarScale = "log" | "linear";

/**
 * Colour by magnitude.
 *
 * "log" is for the long-tailed sets — 998 of 1,274 organizations list a single
 * project, so a linear ramp puts almost every bar on the first stop. The
 * Streamlit reference reaches for log10 at tabs/organisations_tab.py:29 for the
 * same reason; this keeps that and moves it onto the design system's own ramp
 * rather than Plotly's Tealgrn.
 *
 * "linear" is for the small, evenly-spread sets. Six continents spanning 4 to
 * 410 put their top three within one log stop of each other, so every bar that
 * mattered came out the same blue and the colour carried nothing.
 */
function rampColor(
  value: number,
  max: number,
  scale: BarScale,
  ramp: string[],
  fallback: string,
): string {
  if (ramp.length === 0) return fallback;
  if (max <= 0) return ramp[0];
  const share =
    scale === "log"
      ? Math.log10(value + 1) / Math.log10(max + 1)
      : value / max;
  const index = Math.min(
    ramp.length - 1,
    Math.max(0, Math.round(share * (ramp.length - 1))),
  );
  return ramp[index];
}

export function HorizontalBarChart({
  data,
  valueLabel,
  labelWidth = 200,
  rowHeight = 26,
  scale = "log",
  emptyMessage = "Nothing to show.",
  clickNote,
  onSelect,
  exportName,
  exportParts,
  labelColumn = "label",
  label,
}: {
  data: BarDatum[];
  /** Row label for the value in the tooltip, e.g. "Organizations". */
  valueLabel: string;
  labelWidth?: number;
  rowHeight?: number;
  scale?: BarScale;
  emptyMessage?: string;
  /** Footer line in the tooltip; only shown for rows that carry an href. */
  clickNote?: string;
  onSelect?: (datum: BarDatum) => void;
  /** Names the download. Omit to leave this chart without an export control. */
  exportName?: string;
  /** View state that belongs in the filename — a top-N, a category, a filter. */
  exportParts?: (string | number | null | undefined | false)[];
  /** Header for the label column in the CSV — "country", not "label". */
  labelColumn?: string;
  /** What the chart shows, for the canvas's accessible name. */
  label: string;
}) {
  const tokens = useChartTokens();
  const theme = useTheme();
  const chartRef = useRef<EChartHandle | null>(null);
  // `labelWidth` is the desktop gutter. On a phone it is wider than the whole
  // chart box, so the bars had nowhere to draw.
  const [width, setWidth] = useState(0);
  const gutter = width > 0 ? Math.max(72, Math.min(labelWidth, width * 0.34)) : labelWidth;

  const ramp = useMemo(() => sequentialRamp(), [theme]);

  const option: EChartsOption = useMemo(
    () => buildOption(data, valueLabel, gutter, scale, tokens, ramp, clickNote),
    [data, valueLabel, gutter, scale, tokens, ramp, clickNote],
  );

  if (data.length === 0) {
    return (
      <div className="viz-state">
        <p className="viz-state__label">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {exportName ? (
        <div className="viz-toolbar viz-toolbar--trailing">
          <ExportMenu
            formats={["png", "csv"]}
            onExport={(format) => {
              const name = exportFilename(
                exportName,
                format,
                exportParts ?? [],
              );
              if (format === "csv") {
                downloadBlob(csvOf(data, labelColumn, valueLabel), name);
              } else if (chartRef.current) {
                downloadBlob(
                  echartPngBlob(chartRef.current, tokens.surface),
                  name,
                );
              }
            }}
          />
        </div>
      ) : null}
      <EChart
        option={option}
        instanceRef={chartRef}
        label={label}
        onWidth={setWidth}
        // The floor only has to keep a one- or two-row chart from collapsing;
        // 260 left a two-bar chart with 90px between its bars.
        height={Math.max(150, data.length * rowHeight + 64)}
        onClick={(params) => {
          const datum = (params.data as { datum?: BarDatum } | undefined)?.datum;
          if (!datum) return;
          if (onSelect) onSelect(datum);
          else if (datum.href) {
            window.open(datum.href, "_blank", "noopener,noreferrer");
          }
        }}
      />
    </>
  );
}

/**
 * The rows on screen, not the payload behind them.
 *
 * A top-25 view exports 25 rows, and a filtered view exports what survived the
 * filter — dumping the whole file would make the download unrelated to what the
 * reader is looking at.
 */
function csvOf(
  data: BarDatum[],
  labelColumn: string,
  valueLabel: string,
): Blob {
  const extra: string[] = [];
  for (const datum of data) {
    for (const row of datum.rows ?? []) {
      if (!extra.includes(row.label)) extra.push(row.label);
    }
  }
  const hasSubtitle = data.some((datum) => datum.subtitle);
  const hasHref = data.some((datum) => datum.href);

  const columns = [
    labelColumn,
    valueLabel,
    ...(hasSubtitle ? ["detail"] : []),
    ...extra,
    ...(hasHref ? ["url"] : []),
  ];
  const rows: CsvValue[][] = data.map((datum) => [
    datum.label,
    datum.value,
    ...(hasSubtitle ? [datum.subtitle ?? ""] : []),
    ...extra.map(
      (label) => datum.rows?.find((row) => row.label === label)?.value ?? "",
    ),
    ...(hasHref ? [datum.href ?? ""] : []),
  ]);
  return toCsvBlob(columns, rows);
}

function buildOption(
  data: BarDatum[],
  valueLabel: string,
  labelWidth: number,
  scale: BarScale,
  tokens: ChartTokens,
  ramp: string[],
  clickNote?: string,
): EChartsOption {
  // ECharts draws a category axis bottom-up, so the largest has to go last for
  // the chart to read top-down.
  const ordered = [...data].reverse();
  const max = data.reduce((best, item) => Math.max(best, item.value), 0);

  return {
    animationDuration: 400,
    grid: { left: labelWidth + 16, right: Math.min(72, labelWidth * 0.4), top: 12, bottom: 32 },
    tooltip: {
      ...tooltipChrome(tokens),
      formatter: (params: unknown) => {
        const datum = (params as { data?: { datum?: BarDatum } }).data?.datum;
        if (!datum) return "";
        return buildTooltip(tokens, {
          title: datum.label,
          subtitle: datum.subtitle,
          rows: [
            { label: valueLabel, value: formatNumber(datum.value), strong: true },
            ...(datum.rows ?? []),
          ],
          note: datum.href ? clickNote : undefined,
        });
      },
    },
    xAxis: {
      type: "value",
      axisLabel: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid } },
    },
    yAxis: {
      type: "category",
      data: ordered.map((item) => item.label),
      axisLabel: {
        width: labelWidth,
        overflow: "truncate",
        color: tokens.ink,
      },
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 16,
        data: ordered.map((item) => ({
          value: item.value,
          datum: item,
          itemStyle: {
            color: rampColor(item.value, max, scale, ramp, tokens.primary),
            borderRadius: [0, 8, 8, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: tokens.ink,
          formatter: (params: { value?: unknown }) =>
            formatNumber(Number(params.value ?? 0)),
        },
      },
    ],
  };
}
