"use client";

import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@/lib/hooks/use-theme";

import type { EChartsOption } from "echarts";

import { buildTooltip } from "@/lib/charts/tooltip";
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

import { EChart } from "./echart";

function symbolSize(value: number) {
  return Math.max(7, Math.min(28, Math.sqrt(Math.max(value, 0)) * 1.8 + 4));
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

  const option: EChartsOption = useMemo(() => {
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
      grid: { left: 210, right: 28, top: 64, bottom: 44 },
      tooltip: {
        confine: true,
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.tooltipBorder,
        borderWidth: 1,
        extraCssText:
          "box-shadow:0 14px 40px rgba(16,22,32,.14);border-radius:12px",
        formatter: (params: unknown) => {
          const record = (params as { data?: { record?: ProjectsOverTimeRecord } })
            .data?.record;
          if (!record) return "";
          return buildTooltip(tokens, {
            title: record.name,
            subtitle: `${record.category} › ${record.sub_category}`,
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
        axisLabel: { width: 180, overflow: "truncate", color: tokens.ink },
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
            symbolSize: symbolSize(record.size_metrics[sizeMetric] ?? 0),
          })),
      })),
    };
  }, [records, palette, sizeMetric, tokens, payload]);

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
        </div>
      </div>

      {!payload ? (
        <div className="viz-state" aria-busy="true" aria-live="polite">
          <p className="viz-state__label">Loading project lifecycles…</p>
        </div>
      ) : (
        <EChart
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
