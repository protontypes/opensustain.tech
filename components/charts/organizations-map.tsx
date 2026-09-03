"use client";

import { useEffect, useMemo, useState } from "react";

import type { EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { GeoComponent } from "echarts/components";
import { MapChart } from "echarts/charts";

import { buildTooltip } from "@/lib/charts/tooltip";
import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { formatNumber, pluralize } from "@/lib/format";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";
import { useTheme } from "@/lib/hooks/use-theme";
import type {
  OrganizationCountryRecord,
  OrganizationsOverviewPayload,
} from "@/lib/types";

import { EChart, registerMap } from "./echart";
import { useOrganizationFilters } from "./organization-filters";

// Registered here rather than in echart.tsx: that module is imported by every
// route with a chart, so registering the map there shipped it to all of them.
echarts.use([GeoComponent, MapChart]);

const MAP_NAME = "world";
const MAP_URL = "/geo/world-110m.json";
type Metric = "total_projects" | "organization_count";

const METRICS: { id: Metric; label: string; noun: string }[] = [
  { id: "total_projects", label: "Projects", noun: "Projects" },
  { id: "organization_count", label: "Organizations", noun: "Organizations" },
];

/**
 * Upper bound of the colour scale.
 *
 * The United States has 618 projects against a median of 4, so scaling to the
 * maximum leaves every other country on the first stop. The Streamlit reference
 * caps at 150 (tabs/organisations_tab.py:126); this uses the 90th percentile of
 * the countries actually on the map, which adapts as the data grows, and the
 * legend says the top band is open-ended.
 */
function scaleMax(values: number[]): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const at = sorted[Math.floor(0.9 * (sorted.length - 1))];
  return Math.max(1, at);
}

function rampFor(): string[] {
  if (typeof window === "undefined") return [];
  const styles = getComputedStyle(document.documentElement);
  return Array.from({ length: 7 }, (_, index) =>
    styles.getPropertyValue(`--viz-seq-${index}`).trim(),
  ).filter(Boolean);
}

export function OrganizationsMap() {
  const { data, error } = useAnalyticsPayload<OrganizationsOverviewPayload>(
    "organizationsOverview",
  );
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("total_projects");
  const tokens = useChartTokens();
  const theme = useTheme();
  const filters = useOrganizationFilters();

  // 170 KB of geometry, fetched only when this chart mounts — it is the one
  // thing on the page that needs it, and it is dead weight in the bundle.
  useEffect(() => {
    let cancelled = false;
    fetch(MAP_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((geoJson) => {
        if (cancelled) return;
        registerMap(MAP_NAME, geoJson);
        setMapReady(true);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setMapError(cause instanceof Error ? cause.message : "Unknown error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ramp = useMemo(() => rampFor(), [theme]);

  const { onMap, offMap } = useMemo(() => {
    const countries = data?.countries ?? [];
    const index = filters.index;

    // Unfiltered, the payload's own totals are used as they are. Filtered, they
    // cannot answer "academia only", so the per-country counts are recomputed
    // from the organization list — which reproduces these totals exactly when
    // no filter is set, as verifyGeography checks in development.
    const resolved = filters.active && index
      ? (() => {
          const orgs = new Map<string, number>();
          const projects = new Map<string, number>();
          for (const record of data?.organizations_by_project_count ?? []) {
            if (
              !filters.matches(
                record.location_country,
                record.form_of_organization,
              )
            ) {
              continue;
            }
            const iso = index.resolve(record.location_country);
            if (!iso) continue;
            orgs.set(iso, (orgs.get(iso) ?? 0) + 1);
            projects.set(
              iso,
              (projects.get(iso) ?? 0) +
                record.total_listed_projects_in_organization,
            );
          }
          return countries
            .map((country) => ({
              ...country,
              organization_count: orgs.get(country.iso_alpha) ?? 0,
              total_projects: projects.get(country.iso_alpha) ?? 0,
            }))
            .filter((country) => country.organization_count > 0);
        })()
      : countries;

    return {
      onMap: resolved.filter((country) => country.map_eligible),
      // "Global", "European Union" and "Europe" are real values in the source
      // but have no territory to shade.
      offMap: resolved.filter((country) => !country.map_eligible),
    };
  }, [data, filters]);

  const option: EChartsOption = useMemo(() => {
    const max = scaleMax(onMap.map((country) => country[metric]));
    const label = METRICS.find((item) => item.id === metric)?.noun ?? "";

    return {
      animationDuration: 400,
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.tooltipBorder,
        borderWidth: 1,
        extraCssText:
          "box-shadow:0 14px 40px rgba(16,22,32,.14);border-radius:12px",
        formatter: (params: unknown) => {
          const point = params as {
            name?: string;
            data?: { record?: OrganizationCountryRecord };
          };
          const record = point.data?.record;
          if (!record) {
            // A country with no organizations still shows its name, so the
            // absence reads as "none recorded" rather than a broken tooltip.
            return buildTooltip(tokens, {
              title: point.name ?? "",
              rows: [{ label, value: "0" }],
            });
          }
          return buildTooltip(tokens, {
            title: record.country_name,
            rows: [
              {
                label: "Projects",
                value: formatNumber(record.total_projects),
                strong: metric === "total_projects",
              },
              {
                label: "Organizations",
                value: formatNumber(record.organization_count),
                strong: metric === "organization_count",
              },
            ],
          });
        },
      },
      visualMap: {
        type: "continuous",
        min: 0,
        max,
        left: 12,
        bottom: 12,
        itemHeight: 140,
        // `calculable` draws its own handle labels, which printed the scale
        // twice next to these.
        calculable: false,
        // Beyond the 90th percentile every country shares the top colour, so
        // the label says so instead of implying an exact ceiling.
        text: [`${formatNumber(max)}+`, "0"],
        textStyle: { color: tokens.muted, fontFamily: "inherit" },
        inRange: { color: ramp.length ? ramp : [tokens.primary] },
      },
      series: [
        {
          type: "map",
          map: MAP_NAME,
          // The payload keys countries by ISO 3166-1 alpha-3, and so does the
          // vendored GeoJSON. Matching on country names instead would fail on
          // "United States" vs "United States of America".
          nameProperty: "iso_a3",
          roam: true,
          zoom: 1.15,
          itemStyle: {
            // A country with no organizations still has to read as land.
            // Against the panel it was an outline and almost nothing else.
            areaColor: tokens.nullFill,
            borderColor: tokens.surface,
            borderWidth: 0.5,
          },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: tokens.primary },
          },
          select: { disabled: true },
          data: onMap.map((record) => ({
            name: record.iso_alpha,
            value: record[metric],
            record,
          })),
        },
      ],
    };
  }, [onMap, metric, tokens, ramp]);

  if (error || mapError) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>
          The map could not be loaded ({error ?? mapError}).
        </p>
      </div>
    );
  }

  if (data && mapReady && onMap.length === 0 && offMap.length === 0) {
    return (
      <div className="viz-state">
        <p className="viz-state__label">
          No organizations match the current filters.
        </p>
      </div>
    );
  }

  if (!data || !mapReady) {
    return (
      <div className="viz-state" aria-busy="true" aria-live="polite">
        <p className="viz-state__label">Loading the map…</p>
      </div>
    );
  }

  const offMapOrganizations = offMap.reduce(
    (sum, country) => sum + country.organization_count,
    0,
  );
  const offMapProjects = offMap.reduce(
    (sum, country) => sum + country.total_projects,
    0,
  );
  const offMapNames = offMap.map((country) => country.country_name);
  const offMapList =
    offMapNames.length > 1
      ? `${offMapNames.slice(0, -1).join(", ")} or ${offMapNames.at(-1)}`
      : (offMapNames[0] ?? "");

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Shade by</span>
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as Metric)}
            >
              {METRICS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <EChart option={option} height={560} />

      {/* Roughly a fifth of the ecosystem has no territory to sit on, so the
          map alone would understate it without saying this. Both counts are
          stated whichever metric is shaded — the sentence reads as nonsense
          otherwise ("321 organizations belong to organizations that…"). */}
      <p className="viz-chart__note">
        {pluralize(onMap.length, "country", "countries")} shaded.
        {offMap.length > 0 ? (
          <>
            {" "}
            A further {pluralize(offMapOrganizations, "organization")} (
            {pluralize(offMapProjects, "project")}) record {offMapList} rather
            than a country, so they have no territory to shade.
          </>
        ) : null}{" "}
        Scroll to zoom, drag to pan.
      </p>
    </div>
  );
}
