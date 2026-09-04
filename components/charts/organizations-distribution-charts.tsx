"use client";

import { useMemo, useState } from "react";

import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { formatNumber } from "@/lib/format";
import {
  normalizeType,
  titleCase,
  UNKNOWN_CONTINENT,
} from "@/lib/charts/organization-geography";
import type {
  OrganizationProjectCountRecord,
  OrganizationsOverviewPayload,
} from "@/lib/types";

import { HorizontalBarChart, type BarDatum } from "./horizontal-bar-chart";
import { useOrganizationFilters } from "./organization-filters";
import { TopNField } from "./top-n-field";

function useOverview() {
  return useAnalyticsPayload<OrganizationsOverviewPayload>(
    "organizationsOverview",
  );
}

/**
 * The organizations left after the page filters, in payload order (descending
 * by listed projects).
 *
 * Every chart here is derived from this list rather than from the payload's
 * precomputed `countries`, `continent_counts` and `organization_type_counts`.
 * Those are fixed totals over every organization and cannot answer "academia
 * only". Recomputing reproduces them exactly when nothing is filtered —
 * `verifyGeography` checks that on load in development.
 */
function useFilteredOrganizations(): {
  records: OrganizationProjectCountRecord[];
  data: OrganizationsOverviewPayload | null;
  error: string | null;
} {
  const { data, error } = useOverview();
  const filters = useOrganizationFilters();
  const records = useMemo(() => {
    const all = data?.organizations_by_project_count ?? [];
    if (!filters.active) return all;
    return all.filter((record) =>
      filters.matches(record.location_country, record.form_of_organization),
    );
  }, [data, filters]);
  return { records, data, error };
}

/** "A", "A and B", "A, B or C" — for a list inside a sentence. */
function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Counts by key, descending, as every chart here wants them. */
function tally<T>(
  records: T[],
  key: (record: T) => string | null,
): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const value = key(record);
    if (value === null) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([k, count]) => ({ key: k, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function Frame({
  error,
  data,
  children,
}: {
  error: string | null;
  data: unknown;
  children: React.ReactNode;
}) {
  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>Organization data could not be loaded ({error}).</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="viz-state" aria-busy="true" aria-live="polite">
        <p className="viz-state__label">Loading organizations…</p>
      </div>
    );
  }
  return <>{children}</>;
}

/* ------------------------------------------------- top organizations */

export function TopOrganizationsChart() {
  const { records, data, error } = useFilteredOrganizations();
  const filters = useOrganizationFilters();
  const [topN, setTopN] = useState(25);

  const rows: BarDatum[] = useMemo(
    () =>
      records.slice(0, topN).map((record) => ({
        key: record.organization_url || record.organization_name,
        label: record.organization_name,
        value: record.total_listed_projects_in_organization,
        subtitle: [record.location_country, titleCase(record.form_of_organization)]
          .filter(Boolean)
          .join(" · "),
        body: record.organization_description || undefined,
        href: record.organization_url || undefined,
      })),
    [records, topN],
  );

  const single = records.filter(
    (record) => record.total_listed_projects_in_organization === 1,
  ).length;

  return (
    <Frame error={error} data={data}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={records.length}
              noun="organizations"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Listed projects"
          labelWidth={220}
          clickNote="Click to open the organization"
          emptyMessage="No organizations match the current filters."
          exportName="top-organizations"
          label={`Bar chart: top ${rows.length} organizations by listed projects`}
          labelColumn="organization"
          exportParts={[`top-${topN}`, filters.country, filters.type]}
        />
        {/* Most organizations list exactly one project, so the tail is flat. */}
        {records.length > 0 ? (
          <p className="viz-chart__note">
            {formatNumber(single)} of {formatNumber(records.length)}{" "}
            organizations list a single project.
          </p>
        ) : null}
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------- by country */

export function TopCountriesChart() {
  const { records, data, error } = useFilteredOrganizations();
  const filters = useOrganizationFilters();
  const [topN, setTopN] = useState(25);

  const counted = useMemo(() => {
    const index = filters.index;
    if (!index) return [];
    return tally(records, (record) => index.resolve(record.location_country));
  }, [records, filters.index]);

  const rows: BarDatum[] = useMemo(
    () =>
      counted.slice(0, topN).map((entry) => ({
        key: entry.key,
        label:
          filters.index?.byIso.get(entry.key)?.country_name ?? entry.key,
        value: entry.count,
      })),
    [counted, topN, filters.index],
  );

  const nonCountries = useMemo(
    () =>
      new Set(
        [...(filters.index?.byIso.values() ?? [])]
          .filter((country) => !country.map_eligible)
          .map((country) => country.iso_alpha),
      ),
    [filters.index],
  );

  const shownNonCountries = rows
    .filter((row) => nonCountries.has(row.key))
    .map((row) => row.label);

  return (
    <Frame error={error} data={data}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={counted.length}
              noun="countries"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Organizations"
          labelWidth={180}
          emptyMessage="No organizations match the current filters."
          exportName="organizations-by-country"
          label={`Bar chart: top ${rows.length} countries by organization count`}
          labelColumn="country"
          exportParts={[`top-${topN}`, filters.country, filters.type]}
        />
        {/* Built from the rows on screen: the payload has three of these
            buckets, the sentence named two, and a filter can remove any. */}
        {shownNonCountries.length > 0 ? (
          <p className="viz-chart__note">
            {listSentence(shownNonCountries)}{" "}
            {shownNonCountries.length === 1 ? "is a row here" : "are rows here"}
            , not {shownNonCountries.length === 1 ? "a country" : "countries"}.
          </p>
        ) : null}
      </div>
    </Frame>
  );
}

/* ----------------------------------------------------- by continent */

export function ContinentsChart() {
  const { records, data, error } = useFilteredOrganizations();
  const filters = useOrganizationFilters();

  const rows: BarDatum[] = useMemo(() => {
    const index = filters.index;
    if (!index) return [];
    return tally(records, (record) => {
      const iso = index.resolve(record.location_country);
      return iso ? index.continentOf(iso) : UNKNOWN_CONTINENT;
    }).map((entry) => ({ key: entry.key, label: entry.key, value: entry.count }));
  }, [records, filters.index]);

  return (
    <Frame error={error} data={data}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Organizations"
        labelWidth={120}
        rowHeight={44}
        // Six values from 4 to 410: on the log ramp the top three shared a stop.
        scale="linear"
        emptyMessage="No organizations match the current filters."
        exportName="organizations-by-continent"
          label={`Bar chart: organizations by continent`}
        labelColumn="continent"
        exportParts={[filters.country, filters.type]}
      />
    </Frame>
  );
}

/* ---------------------------------------------------------- by type */

export function OrganizationTypesChart() {
  const { records, data, error } = useFilteredOrganizations();
  const filters = useOrganizationFilters();

  const rows: BarDatum[] = useMemo(
    () =>
      tally(records, (record) => normalizeType(record.form_of_organization) || "unknown")
        .map((entry) => ({
          key: entry.key,
          label: titleCase(entry.key),
          value: entry.count,
        })),
    [records],
  );

  return (
    <Frame error={error} data={data}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Organizations"
        labelWidth={150}
        rowHeight={44}
        scale="linear"
        emptyMessage="No organizations match the current filters."
        exportName="organizations-by-type"
          label={`Bar chart: organizations by type`}
        labelColumn="type"
        exportParts={[filters.country, filters.type]}
      />
    </Frame>
  );
}
