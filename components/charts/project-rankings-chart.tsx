"use client";

import { useEffect, useMemo, useState } from "react";

import type { EChartsOption } from "echarts";

import { buildTooltip } from "@/lib/charts/tooltip";
import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { formatCompactNumber, formatDecimal, formatNumber } from "@/lib/format";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";
import { METRIC_ORDER } from "@/lib/sunburst/types";
import type {
  ProjectRankingRecord,
  ProjectRankingsPayload,
  RankingMetricId,
} from "@/lib/types";

import { EChart } from "./echart";

const TOP_N_CHOICES = [10, 25, 50, 100];

function metricValue(record: ProjectRankingRecord, metric: RankingMetricId) {
  const value = record[metric];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatMetric(metric: RankingMetricId, value: number) {
  if (metric === "dds") return formatDecimal(value, 3);
  if (metric === "score" || metric === "total_score_combined") {
    return formatDecimal(value, 2);
  }
  return formatNumber(value);
}

export function ProjectRankingsChart({
  categories,
}: {
  categories: string[];
}) {
  const [payload, setPayload] = useState<ProjectRankingsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<RankingMetricId>("total_score_combined");
  const [category, setCategory] = useState("all");
  const [topN, setTopN] = useState(25);
  const [activeOnly, setActiveOnly] = useState(true);
  const tokens = useChartTokens();

  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("projectRankings"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<ProjectRankingsPayload>;
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

  const top = useMemo(() => {
    if (!payload) return [];
    return payload.records
      .filter((record) => (activeOnly ? record.is_active_last_365d : true))
      .filter((record) => category === "all" || record.category === category)
      .slice()
      .sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
      .slice(0, topN);
  }, [payload, metric, category, topN, activeOnly]);

  const option: EChartsOption = useMemo(() => {
    const ordered = [...top].reverse();
    return {
      animationDuration: 400,
      grid: { left: 210, right: 72, top: 12, bottom: 32 },
      tooltip: {
        confine: true,
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.tooltipBorder,
        borderWidth: 1,
        extraCssText: "box-shadow:0 14px 40px rgba(16,22,32,.14);border-radius:12px",
        formatter: (params: unknown) => {
          const record = (params as { data?: { record?: ProjectRankingRecord } })
            .data?.record;
          if (!record) return "";
          return buildTooltip(tokens, {
            title: record.name,
            subtitle: `${record.category} › ${record.sub_category}`,
            rows: [
              {
                label: payload?.metric_labels[metric] ?? metric,
                value: formatMetric(metric, metricValue(record, metric)),
                strong: true,
              },
              { label: "Stars", value: formatCompactNumber(record.stars) },
              {
                label: "Contributors",
                value: formatNumber(record.contributors),
              },
              {
                label: "Commits",
                value: formatCompactNumber(record.total_commits),
              },
            ],
            note: "Click to open the repository",
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
        data: ordered.map((record) => record.name),
        axisLabel: { width: 180, overflow: "truncate", color: tokens.ink },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 16,
          // Only what the tooltip needs — the old chart spread the whole
          // record, descriptions included, into every data point.
          data: ordered.map((record) => ({
            value: metricValue(record, metric),
            url: record.url,
            record,
            itemStyle: {
              color: tokens.primary,
              borderRadius: [0, 8, 8, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            color: tokens.ink,
            formatter: (params: { value?: unknown }) =>
              formatMetric(metric, Number(params.value ?? 0)),
          },
        },
      ],
    };
  }, [top, metric, tokens, payload]);

  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>Project rankings could not be loaded ({error}).</p>
      </div>
    );
  }

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <div
            className="viz-segmented"
            role="group"
            aria-label="Project activity filter"
          >
            <button
              type="button"
              aria-pressed={!activeOnly}
              onClick={() => setActiveOnly(false)}
            >
              All
            </button>
            <button
              type="button"
              aria-pressed={activeOnly}
              onClick={() => setActiveOnly(true)}
            >
              Active
            </button>
          </div>

          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Rank by</span>
            <select
              value={metric}
              onChange={(event) =>
                setMetric(event.target.value as RankingMetricId)
              }
            >
              {METRIC_ORDER.map((id) => (
                <option key={id} value={id}>
                  {payload?.metric_labels[id] ?? id}
                </option>
              ))}
            </select>
          </label>

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
            <span className="viz-field__label">Show</span>
            <select
              value={topN}
              onChange={(event) => setTopN(Number(event.target.value))}
            >
              {TOP_N_CHOICES.map((choice) => (
                <option key={choice} value={choice}>
                  Top {choice}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!payload ? (
        <div className="viz-state" aria-busy="true" aria-live="polite">
          <p className="viz-state__label">Loading rankings…</p>
        </div>
      ) : top.length === 0 ? (
        <div className="viz-state">
          <p className="viz-state__label">
            No projects match these filters. Try “All” or a different category.
          </p>
        </div>
      ) : (
        <EChart
          option={option}
          height={Math.max(360, top.length * 28 + 60)}
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
