"use client";

import { useEffect, useMemo, useState } from "react";

import type { EChartsOption } from "echarts";

import { buildTooltip } from "@/lib/charts/tooltip";
import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { formatDecimal, formatNumber } from "@/lib/format";
import {
  resolveCategoryColors,
  useChartTokens,
} from "@/lib/hooks/use-chart-tokens";
import { useTheme } from "@/lib/hooks/use-theme";
import type {
  OrganizationRankingRecord,
  OrganizationRankingsPayload,
} from "@/lib/types";

import { useChartExport } from "@/lib/charts/use-chart-export";

import { EChart } from "./echart";
import { ExportMenu } from "./export-menu";
import { useOrganizationFilters } from "./organization-filters";

const TOP_N_CHOICES = [10, 25, 50, 100];
const ALL = "All Categories";

/** The category an organization scores highest in — used for its bar colour. */
function dominantCategory(record: OrganizationRankingRecord): string {
  let best = "";
  let bestScore = -Infinity;
  for (const entry of record.category_breakdown ?? []) {
    if (entry.total_score > bestScore) {
      bestScore = entry.total_score;
      best = entry.category;
    }
  }
  return best;
}

function scoreIn(record: OrganizationRankingRecord, category: string): number {
  if (category === ALL) return record.total_score;
  const entry = record.category_breakdown?.find(
    (item) => item.category === category,
  );
  return entry?.total_score ?? 0;
}

export function OrganizationRankingsChart({
  categories,
  categoryColors,
}: {
  categories: string[];
  categoryColors: Record<string, string>;
}) {
  const [payload, setPayload] = useState<OrganizationRankingsPayload | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(ALL);
  const [topN, setTopN] = useState(25);
  const tokens = useChartTokens();
  const theme = useTheme();
  const filters = useOrganizationFilters();

  const palette = useMemo(
    () => resolveCategoryColors(categories, categoryColors),
    [categories, categoryColors, theme],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("organizationRankings"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<OrganizationRankingsPayload>;
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
      .filter(
        (record) =>
          (category === ALL ||
            record.category_breakdown?.some(
              (item) => item.category === category,
            )) &&
          filters.matches(record.location_country, record.form_of_organization),
      )
      .slice()
      .sort((a, b) => scoreIn(b, category) - scoreIn(a, category))
      .slice(0, topN);
  }, [payload, category, topN, filters]);

  const { chartRef, onExport } = useChartExport(
    "organization-rankings",
    () => ({
      columns: ["organization", "score", "projects", "country", "type", "url"],
      rows: top.map((record) => [
        record.organization_name,
        scoreIn(record, category),
        record.matched_project_count,
        record.location_country,
        record.form_of_organization,
        record.organization_url,
      ]),
    }),
    [
      category === ALL ? null : category,
      `top-${topN}`,
      filters.country,
      filters.type,
    ],
  );

  const option: EChartsOption = useMemo(() => {
    const ordered = [...top].reverse();
    return {
      animationDuration: 400,
      grid: { left: 240, right: 76, top: 12, bottom: 32 },
      tooltip: {
        confine: true,
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.tooltipBorder,
        borderWidth: 1,
        extraCssText:
          "box-shadow:0 14px 40px rgba(16,22,32,.14);border-radius:12px",
        formatter: (params: unknown) => {
          const record = (
            params as { data?: { record?: OrganizationRankingRecord } }
          ).data?.record;
          if (!record) return "";
          const rows = [
            {
              label: category === ALL ? "Total score" : `${category} score`,
              value: formatDecimal(scoreIn(record, category), 2),
              strong: true,
            },
            {
              label: "Projects",
              value: formatNumber(record.matched_project_count),
            },
          ];
          if (record.form_of_organization) {
            rows.push({
              label: "Type",
              value: record.form_of_organization,
              strong: false,
            });
          }
          if (record.location_country) {
            rows.push({
              label: "Country",
              value: record.location_country,
              strong: false,
            });
          }
          return buildTooltip(tokens, {
            title: record.organization_name,
            subtitle: dominantCategory(record) || undefined,
            rows,
            note: "Click to open the organization",
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
        data: ordered.map((record) => record.organization_name),
        axisLabel: { width: 200, overflow: "truncate", color: tokens.ink },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 16,
          data: ordered.map((record) => ({
            value: scoreIn(record, category),
            organization_url: record.organization_url,
            record,
            itemStyle: {
              // Same hues as the sunbursts, so an organization keeps its
              // colour wherever it appears.
              color:
                palette[
                  category === ALL ? dominantCategory(record) : category
                ] ?? tokens.primary,
              borderRadius: [0, 8, 8, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            color: tokens.ink,
            formatter: (params: { value?: unknown }) =>
              formatDecimal(Number(params.value ?? 0), 2),
          },
        },
      ],
    };
  }, [top, category, palette, tokens]);

  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>Organization rankings could not be loaded ({error}).</p>
      </div>
    );
  }

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
              <option value={ALL}>{ALL}</option>
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
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      {!payload ? (
        <div className="viz-state" aria-busy="true" aria-live="polite">
          <p className="viz-state__label">Loading organizations…</p>
        </div>
      ) : top.length === 0 ? (
        <div className="viz-state">
          <p className="viz-state__label">
            {filters.active
              ? "No organizations match the current filters."
              : `No organizations work in ${category}.`}
          </p>
        </div>
      ) : (
        <EChart
          instanceRef={chartRef}
          option={option}
          height={Math.max(360, top.length * 28 + 60)}
          onClick={(params) => {
            const data = params.data as
              | { organization_url?: string }
              | undefined;
            if (data?.organization_url) {
              window.open(data.organization_url, "_blank", "noopener,noreferrer");
            }
          }}
        />
      )}
    </div>
  );
}
