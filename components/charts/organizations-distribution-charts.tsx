"use client";

import { useMemo, useState } from "react";

import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { formatNumber } from "@/lib/format";
import type { OrganizationsOverviewPayload } from "@/lib/types";

import { HorizontalBarChart, type BarDatum } from "./horizontal-bar-chart";
import { TopNField } from "./top-n-field";

/** Title-cases the raw `form_of_organization` values, which are lower-cased. */
function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

function useOverview() {
  return useAnalyticsPayload<OrganizationsOverviewPayload>(
    "organizationsOverview",
  );
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
  const { data, error } = useOverview();
  const [topN, setTopN] = useState(25);

  const records = data?.organizations_by_project_count ?? [];
  const rows: BarDatum[] = useMemo(
    () =>
      records.slice(0, topN).map((record) => ({
        key: record.organization_url || record.organization_name,
        label: record.organization_name,
        value: record.total_listed_projects_in_organization,
        subtitle: [record.location_country, titleCase(record.form_of_organization)]
          .filter(Boolean)
          .join(" · "),
        href: record.organization_url || undefined,
      })),
    [records, topN],
  );

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
        />
        {/* 998 of the 1,274 list exactly one project, so the tail is flat. */}
        <p className="viz-chart__note">
          {formatNumber(records.filter((r) => r.total_listed_projects_in_organization === 1).length)}{" "}
          of {formatNumber(records.length)} organizations list a single project.
        </p>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------- by country */

export function TopCountriesChart() {
  const { data, error } = useOverview();
  const [topN, setTopN] = useState(25);

  const countries = data?.countries ?? [];
  const rows: BarDatum[] = useMemo(
    () =>
      [...countries]
        .sort((a, b) => b.organization_count - a.organization_count)
        .slice(0, topN)
        .map((country) => ({
          key: country.iso_alpha,
          label: country.country_name,
          value: country.organization_count,
          rows: [
            { label: "Projects", value: formatNumber(country.total_projects) },
          ],
        })),
    [countries, topN],
  );

  return (
    <Frame error={error} data={data}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={countries.length}
              noun="countries"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Organizations"
          labelWidth={180}
        />
        {/* "Global" is a real value in the source, not a country. */}
        <p className="viz-chart__note">
          Includes Global and European Union, which organizations record in
          place of a country.
        </p>
      </div>
    </Frame>
  );
}

/* ----------------------------------------------------- by continent */

export function ContinentsChart() {
  const { data, error } = useOverview();
  const rows: BarDatum[] = useMemo(
    () =>
      (data?.continent_counts ?? []).map((record) => ({
        key: record.continent,
        label: record.continent,
        value: record.count,
      })),
    [data],
  );

  return (
    <Frame error={error} data={data}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Organizations"
        labelWidth={120}
        rowHeight={44}
        // Six values from 4 to 410: on the log ramp the top three shared a stop.
        scale="linear"
      />
    </Frame>
  );
}

/* ---------------------------------------------------------- by type */

export function OrganizationTypesChart() {
  const { data, error } = useOverview();
  const rows: BarDatum[] = useMemo(
    () =>
      (data?.organization_type_counts ?? []).map((record) => ({
        key: record.form_of_organization,
        label: titleCase(record.form_of_organization),
        value: record.count,
      })),
    [data],
  );

  return (
    <Frame error={error} data={data}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Organizations"
        labelWidth={150}
        rowHeight={44}
        scale="linear"
      />
    </Frame>
  );
}
