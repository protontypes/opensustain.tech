"use client";

import { useMemo, useState } from "react";

import type { EChartsOption } from "echarts";
import { LineChart } from "echarts/charts";
import { MarkLineComponent } from "echarts/components";
import * as echarts from "echarts/core";

import { buildTooltip, tooltipChrome } from "@/lib/charts/tooltip";
import { useChartExport } from "@/lib/charts/use-chart-export";
import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";
import type {
  ProjectRankingRecord,
  ProjectRankingsPayload,
  ProjectsOverTimePayload,
  SummaryPayload,
} from "@/lib/types";

import { EChart } from "./echart";
import { ExportMenu } from "./export-menu";
import { useProjectFilters } from "./project-filters";

import styles from "./ecosystem-health.module.css";

// Registered here rather than in echart.tsx: only this route draws a line or a
// reference line, and echart.tsx's registrations ship to every chart route.
echarts.use([LineChart, MarkLineComponent]);

/* ------------------------------------------------------------ shared bits */

/** Holds the chart's height while its payload loads, so nothing below jumps. */
function Placeholder({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div className="viz-state" style={{ minHeight: height }} aria-busy="true" aria-live="polite">
      <p className="viz-state__label">{children}</p>
    </div>
  );
}

function LoadError({ height, what, error }: { height: number; what: string; error: string }) {
  return (
    <div className="viz-state viz-state--error" style={{ minHeight: height }} role="alert">
      <p>
        {what} could not be loaded ({error}).
      </p>
    </div>
  );
}

function Empty({ height }: { height: number }) {
  return (
    <div className="viz-state" style={{ minHeight: height }}>
      <p className="viz-state__label">No projects match these filters.</p>
    </div>
  );
}

function ActiveToggle({
  activeOnly,
  onChange,
}: {
  activeOnly: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="viz-segmented" role="group" aria-label="Project activity filter">
      <button type="button" aria-pressed={!activeOnly} onClick={() => onChange(false)}>
        All
      </button>
      <button type="button" aria-pressed={activeOnly} onClick={() => onChange(true)}>
        Active
      </button>
    </div>
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** A timestamp as a fractional year: 2026-09-19 → 2026.72. */
function fractionalYear(iso: string): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return year + (date.getTime() - start) / (end - start);
}

/** The y-axis gutter, scaled so long labels fit a phone without a fixed 240px. */
function gutterFor(width: number, max: number) {
  return width > 0 ? Math.max(88, Math.min(max, width * 0.4)) : max;
}

/* ------------------------------------------------------- ecosystem growth */

const GROWTH_HEIGHT = 360;
/** The axis starts here; older projects are counted in its first year. */
const GROWTH_FIRST_YEAR = 2005;

/**
 * Cumulative count of projects by the year of their first commit.
 *
 * The payloads carry each project's age, not its start date, so the start year
 * is the snapshot's own date minus that age. That is the pipeline's reference
 * point — summary.json's `as_of` — rather than today's date, so the chart does
 * not drift as the payload ages.
 */
export function EcosystemGrowthChart() {
  const overTime = useAnalyticsPayload<ProjectsOverTimePayload>("projectsOverTime");
  const summary = useAnalyticsPayload<SummaryPayload>("summary");
  const filters = useProjectFilters();
  const tokens = useChartTokens();
  const [activeOnly, setActiveOnly] = useState(false);
  const [width, setWidth] = useState(0);

  const growth = useMemo(() => {
    const data = overTime.data;
    if (!data) return null;
    const asOf = fractionalYear(summary.data?.as_of ?? data.generated_at);
    if (asOf === null) return null;
    const lastYear = Math.floor(asOf);

    const started = new Map<number, number>();
    let matched = 0;
    let undated = 0;
    for (const record of data.records) {
      if (!filters.matches(record.category, record.sub_category)) continue;
      if (activeOnly && !record.is_active_last_365d) continue;
      matched += 1;
      // The pipeline fills a missing first-commit date with an age of 0, which
      // would count every undated project as started this year.
      if (!(record.project_age_years > 0)) {
        undated += 1;
        continue;
      }
      const year = Math.min(
        lastYear,
        Math.max(GROWTH_FIRST_YEAR, Math.floor(asOf - record.project_age_years)),
      );
      started.set(year, (started.get(year) ?? 0) + 1);
    }

    const years: number[] = [];
    const added: number[] = [];
    const total: number[] = [];
    let running = 0;
    for (let year = GROWTH_FIRST_YEAR; year <= lastYear; year += 1) {
      const count = started.get(year) ?? 0;
      running += count;
      years.push(year);
      added.push(count);
      total.push(running);
    }
    return { years, added, total, matched, undated };
  }, [overTime.data, summary.data, filters, activeOnly]);

  const { chartRef, onExport } = useChartExport(
    "ecosystem-growth",
    () => ({
      columns: ["year", "projects_started", "projects_tracked"],
      rows: growth
        ? growth.years.map((year, index) => [year, growth.added[index], growth.total[index]])
        : [],
    }),
    [filters.exportPart, activeOnly && "active-only"],
  );

  const option = useMemo<EChartsOption>(() => {
    if (!growth) return {};
    const lastIndex = growth.years.length - 1;
    return {
      animationDuration: 400,
      grid: { left: width > 0 && width < 480 ? 44 : 56, right: 20, top: 40, bottom: 32 },
      tooltip: {
        ...tooltipChrome(tokens),
        trigger: "axis",
        formatter: (params: unknown) => {
          const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number };
          const index = first?.dataIndex ?? 0;
          const year = growth.years[index];
          return buildTooltip(tokens, {
            title: index === 0 ? `${year} and earlier` : String(year),
            rows: [
              {
                label: index === lastIndex ? "Projects tracked to date" : "Projects tracked by year end",
                value: formatNumber(growth.total[index]),
                strong: true,
              },
              {
                label: index === 0 ? "Started by then" : "Started that year",
                value: formatNumber(growth.added[index]),
              },
            ],
          });
        },
      },
      xAxis: {
        type: "category",
        data: growth.years.map(String),
        boundaryGap: false,
        axisLabel: { color: tokens.muted, hideOverlap: true },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: tokens.muted },
        splitLine: { lineStyle: { color: tokens.grid } },
      },
      series: [
        {
          type: "line",
          name: "Projects tracked",
          symbol: "circle",
          symbolSize: 0,
          lineStyle: { color: tokens.primary, width: 2.5 },
          itemStyle: { color: tokens.primary },
          areaStyle: { color: tokens.primary, opacity: 0.12 },
          // Only the latest point is drawn and labelled: the current total.
          data: growth.total.map((value, index) =>
            index === lastIndex
              ? {
                  value,
                  symbolSize: 11,
                  itemStyle: {
                    color: tokens.highlight,
                    borderColor: tokens.surface,
                    borderWidth: 2,
                  },
                  label: {
                    show: true,
                    position: "top",
                    align: "right",
                    distance: 10,
                    color: tokens.inkStrong,
                    fontWeight: 700,
                    fontSize: 13,
                    formatter: formatNumber(value),
                  },
                }
              : value,
          ),
        },
      ],
    };
  }, [growth, tokens, width]);

  if (overTime.error) {
    return <LoadError height={GROWTH_HEIGHT} what="Project ages" error={overTime.error} />;
  }

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <ActiveToggle activeOnly={activeOnly} onChange={setActiveOnly} />
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      {!growth ? (
        <Placeholder height={GROWTH_HEIGHT}>Loading project ages…</Placeholder>
      ) : growth.matched === 0 ? (
        <Empty height={GROWTH_HEIGHT} />
      ) : (
        <EChart
          instanceRef={chartRef}
          onWidth={setWidth}
          label={`Line chart: ${formatNumber(
            growth.total[growth.total.length - 1] ?? 0,
          )} projects tracked, cumulative by year of first commit`}
          option={option}
          height={GROWTH_HEIGHT}
        />
      )}

      {growth && growth.undated > 0 ? (
        <p className="viz-chart__note">
          {formatNumber(growth.undated)} of these {formatNumber(growth.matched)} projects
          have no recorded first commit, so they are left out.
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------- activity pulse */

const PULSE_ROW = 34;

type PulseRow = { name: string; projects: number; active: number; share: number };

/**
 * Share of projects with a commit in the last 365 days, per category — or per
 * sub-category once the filters narrow the page to a single category.
 */
export function ActivityPulseChart() {
  const rankings = useAnalyticsPayload<ProjectRankingsPayload>("projectRankings");
  const filters = useProjectFilters();
  const tokens = useChartTokens();
  const [width, setWidth] = useState(0);

  const pulse = useMemo(() => {
    const data = rankings.data;
    if (!data || data.records.length === 0) return null;
    const bySubCategory = filters.categories.length === 1 || filters.subCategories.length > 0;

    const groups = new Map<string, { projects: number; active: number }>();
    let activeOverall = 0;
    for (const record of data.records) {
      if (record.is_active_last_365d) activeOverall += 1;
      if (!filters.matches(record.category, record.sub_category)) continue;
      const key = bySubCategory ? record.sub_category : record.category;
      const group = groups.get(key) ?? { projects: 0, active: 0 };
      group.projects += 1;
      if (record.is_active_last_365d) group.active += 1;
      groups.set(key, group);
    }

    const rows: PulseRow[] = [...groups.entries()]
      .map(([name, group]) => ({ name, ...group, share: group.active / group.projects }))
      .sort((a, b) => b.share - a.share || b.projects - a.projects);
    return {
      rows,
      bySubCategory,
      overall: activeOverall / data.records.length,
      total: data.records.length,
    };
  }, [rankings.data, filters]);

  const groupNoun = pulse?.bySubCategory ? "sub_category" : "category";
  const { chartRef, onExport } = useChartExport(
    "activity-pulse",
    () => ({
      columns: [groupNoun, "projects", "active_last_365d", "share_active"],
      rows: (pulse?.rows ?? []).map((row) => [
        row.name,
        row.projects,
        row.active,
        Number(row.share.toFixed(4)),
      ]),
    }),
    [filters.exportPart],
  );

  const height = Math.max(240, (pulse?.rows.length ?? 13) * PULSE_ROW + 72);
  const gutter = gutterFor(width, 240);

  const option = useMemo<EChartsOption>(() => {
    if (!pulse) return {};
    return {
      animationDuration: 400,
      grid: { left: gutter + 12, right: 56, top: 32, bottom: 28 },
      tooltip: {
        ...tooltipChrome(tokens),
        formatter: (params: unknown) => {
          const row = (params as { data?: { row?: PulseRow } }).data?.row;
          if (!row) return "";
          return buildTooltip(tokens, {
            title: row.name,
            subtitle: pulse.bySubCategory ? "Sub-category" : "Category",
            rows: [
              { label: "Active in the last 365 days", value: formatPercent(row.share), strong: true },
              { label: "Active projects", value: formatNumber(row.active) },
              { label: "Dormant projects", value: formatNumber(row.projects - row.active) },
            ],
          });
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { color: tokens.muted, formatter: "{value}%" },
        splitLine: { lineStyle: { color: tokens.grid } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: pulse.rows.map((row) => `${row.name} (n=${formatNumber(row.projects)})`),
        axisLabel: { width: Math.max(72, gutter - 8), overflow: "truncate", color: tokens.ink },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 16,
          data: pulse.rows.map((row) => ({
            value: Number((row.share * 100).toFixed(1)),
            row,
            itemStyle: { color: tokens.primary, borderRadius: [0, 8, 8, 0] },
          })),
          label: {
            show: true,
            position: "right",
            color: tokens.ink,
            formatter: (params: { value?: unknown }) => `${Math.round(Number(params.value ?? 0))}%`,
          },
          markLine: {
            symbol: "none",
            silent: true,
            lineStyle: { color: tokens.muted, type: "dashed", width: 1.5 },
            label: {
              position: "start",
              color: tokens.muted,
              fontWeight: 600,
              formatter: `All projects ${formatPercent(pulse.overall)}`,
            },
            data: [{ xAxis: Number((pulse.overall * 100).toFixed(1)) }],
          },
        },
      ],
    };
  }, [pulse, tokens, gutter]);

  if (rankings.error) {
    return <LoadError height={height} what="Project activity" error={rankings.error} />;
  }

  const quietest = pulse?.rows[pulse.rows.length - 1];

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      {!pulse ? (
        <Placeholder height={height}>Loading project activity…</Placeholder>
      ) : pulse.rows.length === 0 ? (
        <Empty height={height} />
      ) : (
        <>
          <EChart
            instanceRef={chartRef}
            onWidth={setWidth}
            label={`Bar chart: share of projects active in the last 365 days, by ${
              pulse.bySubCategory ? "sub-category" : "category"
            }`}
            option={option}
            height={height}
          />
          <p className="viz-chart__note">
            {formatPercent(pulse.overall)} of all {formatNumber(pulse.total)} tracked
            projects had a commit in the last 365 days.
            {quietest && pulse.rows.length > 1 ? (
              <>
                {" "}
                Least active here:{" "}
                <span className={styles.caution}>
                  {quietest.name} ({formatPercent(quietest.share)})
                </span>
                .
              </>
            ) : null}
          </p>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------- strength in numbers */

const STRENGTH_HEIGHT = 300;

type Bracket = { label: string; test: (value: number) => boolean };

const CONTRIBUTOR_BRACKETS: Bracket[] = [
  { label: "1", test: (v) => v < 2 },
  { label: "2–3", test: (v) => v < 4 },
  { label: "4–9", test: (v) => v < 10 },
  { label: "10–29", test: (v) => v < 30 },
  { label: "30–99", test: (v) => v < 100 },
  { label: "100+", test: () => true },
];

/** Development Distribution Score: 0 means one person made every commit. */
const DDS_BRACKETS: Bracket[] = [
  { label: "0", test: (v) => v <= 0 },
  { label: "0–0.1", test: (v) => v < 0.1 },
  { label: "0.1–0.25", test: (v) => v < 0.25 },
  { label: "0.25–0.5", test: (v) => v < 0.5 },
  { label: "0.5+", test: () => true },
];

type StrengthView = "contributors" | "dds";

/**
 * How many people stand behind each project — the bus-factor view — and, as a
 * second view, how evenly their commits are spread.
 */
export function StrengthInNumbersChart() {
  const rankings = useAnalyticsPayload<ProjectRankingsPayload>("projectRankings");
  const summary = useAnalyticsPayload<SummaryPayload>("summary");
  const filters = useProjectFilters();
  const tokens = useChartTokens();
  const [view, setView] = useState<StrengthView>("contributors");

  const strength = useMemo(() => {
    const data = rankings.data;
    if (!data) return null;
    const records = data.records.filter((record) =>
      filters.matches(record.category, record.sub_category),
    );
    const brackets = view === "contributors" ? CONTRIBUTOR_BRACKETS : DDS_BRACKETS;
    const counts = brackets.map(() => 0);
    for (const record of records) {
      const value = view === "contributors" ? record.contributors : record.dds;
      const index = brackets.findIndex((bracket) => bracket.test(value));
      counts[index] += 1;
    }

    const contributors = records.map((record) => record.contributors);
    const top = records.reduce<ProjectRankingRecord | null>(
      (best, record) => (!best || record.contributors > best.contributors ? record : best),
      null,
    );
    return {
      total: records.length,
      buckets: brackets.map((bracket, index) => ({
        label: bracket.label,
        projects: counts[index],
        share: records.length ? counts[index] / records.length : 0,
      })),
      smallShare: records.length
        ? contributors.filter((count) => count <= 3).length / records.length
        : 0,
      // The pipeline's own median for the whole ecosystem; recomputed once the
      // filters narrow it.
      medianContributors: filters.active
        ? median(contributors)
        : (summary.data?.medians.contributors ?? median(contributors)),
      top,
    };
  }, [rankings.data, summary.data, filters, view]);

  const { chartRef, onExport } = useChartExport(
    "strength-in-numbers",
    () => ({
      columns: [view === "contributors" ? "contributors" : "dds", "projects", "share"],
      rows: (strength?.buckets ?? []).map((bucket) => [
        bucket.label,
        bucket.projects,
        Number(bucket.share.toFixed(4)),
      ]),
    }),
    [view, filters.exportPart],
  );

  const option = useMemo<EChartsOption>(() => {
    if (!strength) return {};
    const axisName = view === "contributors" ? "Contributors" : "Development Distribution Score";
    return {
      animationDuration: 400,
      grid: { left: 48, right: 16, top: 28, bottom: 52 },
      tooltip: {
        ...tooltipChrome(tokens),
        formatter: (params: unknown) => {
          const index = (params as { dataIndex?: number }).dataIndex ?? 0;
          const bucket = strength.buckets[index];
          return buildTooltip(tokens, {
            title: view === "contributors" ? `${bucket.label} contributors` : `DDS ${bucket.label}`,
            rows: [
              { label: "Projects", value: formatNumber(bucket.projects), strong: true },
              { label: "Share of projects", value: formatPercent(bucket.share) },
            ],
          });
        },
      },
      xAxis: {
        type: "category",
        data: strength.buckets.map((bucket) => bucket.label),
        name: axisName,
        nameLocation: "middle",
        nameGap: 32,
        nameTextStyle: { color: tokens.muted },
        axisLabel: { color: tokens.ink },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: tokens.muted },
        splitLine: { lineStyle: { color: tokens.grid } },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 56,
          data: strength.buckets.map((bucket) => ({
            value: bucket.projects,
            itemStyle: { color: tokens.primary, borderRadius: [8, 8, 0, 0] },
          })),
          label: {
            show: true,
            position: "top",
            color: tokens.ink,
            formatter: (params: { value?: unknown }) => formatNumber(Number(params.value ?? 0)),
          },
        },
      ],
    };
  }, [strength, tokens, view]);

  if (rankings.error) {
    return <LoadError height={STRENGTH_HEIGHT} what="Contributor counts" error={rankings.error} />;
  }

  return (
    <div className="viz-root">
      {strength && strength.total > 0 ? (
        <ul className={styles.stats}>
          <li className={styles.stat}>
            <p className={styles.statLabel}>3 or fewer contributors</p>
            <p className={styles.statValue}>{formatPercent(strength.smallShare)}</p>
            <p className={styles.statHint}>of {formatNumber(strength.total)} projects</p>
          </li>
          <li className={styles.stat}>
            <p className={styles.statLabel}>Median contributors</p>
            <p className={styles.statValue}>
              {strength.medianContributors === null
                ? "—"
                : formatDecimal(strength.medianContributors, 1).replace(/\.0$/, "")}
            </p>
            <p className={styles.statHint}>per project</p>
          </li>
          {strength.top ? (
            <li className={styles.stat}>
              <p className={styles.statLabel}>Most contributors</p>
              <p className={styles.statValue}>{formatNumber(strength.top.contributors)}</p>
              <p className={styles.statHint}>{strength.top.name}</p>
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <div className="viz-segmented" role="group" aria-label="Measure">
            <button
              type="button"
              aria-pressed={view === "contributors"}
              onClick={() => setView("contributors")}
            >
              Contributors
            </button>
            <button type="button" aria-pressed={view === "dds"} onClick={() => setView("dds")}>
              Commit spread (DDS)
            </button>
          </div>
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      {!strength ? (
        <Placeholder height={STRENGTH_HEIGHT}>Loading contributor counts…</Placeholder>
      ) : strength.total === 0 ? (
        <Empty height={STRENGTH_HEIGHT} />
      ) : (
        <EChart
          instanceRef={chartRef}
          label={
            view === "contributors"
              ? "Bar chart: projects by number of contributors"
              : "Bar chart: projects by Development Distribution Score"
          }
          option={option}
          height={STRENGTH_HEIGHT}
        />
      )}

      <p className="viz-chart__note">
        {view === "contributors"
          ? "A one-person tool is one resignation away from abandonment."
          : "DDS is the share of commits not made by a project's most active contributor: 0 means one person made every commit."}
      </p>
    </div>
  );
}
