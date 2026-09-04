"use client";

import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@/lib/hooks/use-theme";

import type { EChartsOption } from "echarts";

import {
  buildTooltip,
  tooltipChrome,
} from "@/lib/charts/tooltip";
import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { formatDecimal, formatNumber } from "@/lib/format";
import {
  resolveCategoryColors,
  useChartTokens,
} from "@/lib/hooks/use-chart-tokens";
import type {
  ProjectsOverTimePayload,
  ProjectsOverTimeRecord,
  BubbleSizeMetricId,
} from "@/lib/types";

import { useChartExport } from "@/lib/charts/use-chart-export";

import { EChart } from "./echart";
import { ExportMenu } from "./export-menu";

/**
 * Bubble radius, normalised against the points actually on screen.
 *
 * The previous curve clamped at 28px, so every project above 178 drew as the
 * identical maximum dot — 1,623 of 2,691 points for Total Commits, where a
 * project with 131,014 commits and one with 2,699 were the same circle. Scaling
 * to the filtered maximum keeps the range legible whichever metric and category
 * are selected, which is what Plotly's `size_max` does in the reference.
 */
function makeSymbolSize(max: number) {
  const root = Math.sqrt(Math.max(max, 1));
  return (value: number) => 6 + (Math.sqrt(Math.max(value, 0)) / root) * 26;
}

export function ProjectsOverTimeChart({
  categoryColors,
  categories,
}: {
  categoryColors: Record<string, string>;
  categories: string[];
}) {
  const [payload, setPayload] = useState<ProjectsOverTimePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [sizeMetric, setSizeMetric] =
    useState<BubbleSizeMetricId>("contributors");
  const tokens = useChartTokens();
  const theme = useTheme();
  // Same hues as the sunbursts, resolved to literals for the canvas renderer.
  const palette = useMemo(
    () => resolveCategoryColors(categories, categoryColors),
    [categories, categoryColors, theme],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("projectsOverTime"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<ProjectsOverTimePayload>;
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

  const records = useMemo(() => {
    if (!payload) return [];
    return category === "all"
      ? payload.records
      : payload.records.filter((record) => record.category === category);
  }, [payload, category]);

  // The last ECharts chart on a fixed gutter: 210px of a 360px phone.
  const [width, setWidth] = useState(0);
  const gutter =
    width > 0 ? Math.max(72, Math.min(210, width * 0.34)) : 210;

  const { chartRef, onExport } = useChartExport(
    "projects-over-time",
    () => ({
      columns: [
        "project",
        "category",
        "sub_category",
        "project_age_years",
        String(sizeMetric),
        "active",
        "url",
      ],
      rows: records.map((record) => [
        record.name,
        record.category,
        record.sub_category,
        record.project_age_years,
        record.size_metrics[sizeMetric] ?? "",
        record.is_active_last_365d,
        record.url,
      ]),
    }),
    [category === "all" ? null : category, String(sizeMetric)],
  );

  const option: EChartsOption = useMemo(() => {
    // Normalised per view, so switching metric or category rescales the dots.
    const sizeFor = makeSymbolSize(
      records.reduce(
        (best, record) => Math.max(best, record.size_metrics[sizeMetric] ?? 0),
        0,
      ),
    );

    const shown = Array.from(
      new Set(records.map((record) => record.category)),
    ).filter(Boolean);
    const subCategories = Array.from(
      new Set(records.map((record) => record.sub_category)),
    ).sort((left, right) => right.localeCompare(left));
    const sizeLabel =
      payload?.size_metric_labels[sizeMetric] ?? String(sizeMetric);

    return {
      legend: {
        type: "scroll",
        top: 0,
        textStyle: { color: tokens.ink },
        pageTextStyle: { color: tokens.muted },
        inactiveColor: tokens.muted,
      },
      grid: { left: gutter + 16, right: 28, top: 92, bottom: 16 },
      tooltip: {
        ...tooltipChrome(tokens),
        formatter: (params: unknown) => {
          const record = (params as { data?: { record?: ProjectsOverTimeRecord } })
            .data?.record;
          if (!record) return "";
          return buildTooltip(tokens, {
            title: record.name,
            subtitle: `${record.category} › ${record.sub_category}`,
            body: record.description || undefined,
            rows: [
              {
                label: "Age",
                value: `${formatDecimal(record.project_age_years, 1)} years`,
              },
              {
                label: sizeLabel,
                value: formatNumber(record.size_metrics[sizeMetric] ?? 0),
                strong: true,
              },
              {
                label: "Status",
                value: record.is_active_last_365d ? "Active" : "Dormant",
              },
            ],
            note: "Click to open the repository",
          });
        },
      },
      xAxis: {
        type: "value",
        // The chart is ~1,700px tall with all 81 sub-categories, so an axis at
        // the bottom is off-screen for most of the scroll and a bubble's
        // horizontal position becomes unreadable. Streamlit moved it up for the
        // same reason (tabs/projects_over_time_tab.py:137).
        position: "top",
        name: "Project age (years)",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: tokens.muted },
        inverse: true,
        axisLabel: { color: tokens.muted },
        splitLine: { lineStyle: { color: tokens.grid } },
      },
      yAxis: {
        type: "category",
        data: subCategories,
        axisLabel: {
          width: Math.max(56, gutter - 8),
          overflow: "truncate",
          color: tokens.ink,
        },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: tokens.grid } },
      },
      series: shown.map((name) => ({
        name,
        type: "scatter" as const,
        // Colour belongs on the SERIES: the legend icon takes its colour from
        // here, so setting it only per data point left every legend swatch on
        // ECharts' own default palette while the dots used ours.
        itemStyle: { color: palette[name] ?? tokens.primary, opacity: 0.85 },
        data: records
          .filter((record) => record.category === name)
          .map((record) => ({
            value: [record.project_age_years, record.sub_category],
            url: record.url,
            record,
            symbolSize: sizeFor(record.size_metrics[sizeMetric] ?? 0),
          })),
      })),
    };
  }, [records, palette, sizeMetric, tokens, payload, gutter]);

  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>Project lifecycle data could not be loaded ({error}).</p>
      </div>
    );
  }

  const subCategoryCount = new Set(records.map((r) => r.sub_category)).size;

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Bubble size</span>
            <select
              value={sizeMetric}
              onChange={(event) =>
                setSizeMetric(event.target.value as BubbleSizeMetricId)
              }
            >
              {Object.entries(payload?.size_metric_labels ?? {}).map(
                ([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      {!payload ? (
        <div className="viz-state" aria-busy="true" aria-live="polite">
          <p className="viz-state__label">Loading project lifecycles…</p>
        </div>
      ) : (
        <EChart
          onWidth={setWidth}
          instanceRef={chartRef}
          label={`Scatter chart: ${records.length} projects by age and sub-category`}
          option={option}
          height={Math.max(520, 18 * subCategoryCount + 260)}
          onClick={(params) => {
            const data = params.data as { url?: string } | undefined;
            if (data?.url) {
              window.open(data.url, "_blank", "noopener,noreferrer");
            }
          }}
        />
      )}
    </div>
  );
}
