"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { formatNumber, formatPercent } from "@/lib/format";
import type {
  CountRecord,
  ProjectAttributeField,
  ProjectAttributeRecordsPayload,
  ProjectAttributesPayload,
  ProjectAttributeValues,
} from "@/lib/types";

import { HorizontalBarChart, type BarDatum } from "./horizontal-bar-chart";
import { useProjectFilters } from "./project-filters";
import { TopNField } from "./top-n-field";

/** The pipeline's stand-in for a missing value, in every field it counts. */
const MISSING = "Unknown";
const MISSING_LABEL = "Not recorded";

const ACTIVE_LABEL = "Active (Commits in Last 365 Days)";
const INACTIVE_LABEL = "Inactive (No Commits in Last 365 Days)";

const FIELDS: ProjectAttributeField[] = [
  "code_of_conduct",
  "contributing_guide",
  "license",
  "language",
  "ecosystems",
  "platform",
];

type AttributeCounts = {
  commitActivity: CountRecord[];
  fields: Record<ProjectAttributeField, CountRecord[]>;
  topNDefault: number;
  /** Projects passing the filters. */
  matched: number;
  /** Of those, projects with no attribute data, left out of `fields`. */
  missing: number;
};

/** Largest first, as the pipeline's `value_counts` orders them. */
function countBy(labels: string[]): CountRecord[] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Attribute counts for whatever the page's filters select.
 *
 * Unfiltered, this is project-attributes.json exactly as the pipeline counted
 * it. Filtered, it recounts project-attribute-records.json — one row per
 * project, written by scripts/fetch-data.mjs from the same CSV columns with
 * the same blank-is-Unknown rules — over just the matching projects. That file
 * is only fetched once a filter is set.
 */
function useAttributeCounts(): { counts: AttributeCounts | null; error: string | null } {
  const filters = useProjectFilters();
  const aggregate = useAnalyticsPayload<ProjectAttributesPayload>("projectAttributes");
  const perProject = useAnalyticsPayload<ProjectAttributeRecordsPayload>(
    filters.active ? "projectAttributeRecords" : null,
  );

  const counts = useMemo<AttributeCounts | null>(() => {
    if (!filters.active) {
      const data = aggregate.data;
      if (!data) return null;
      const matched = data.commit_activity.reduce((sum, record) => sum + record.count, 0);
      return {
        commitActivity: data.commit_activity,
        fields: data.fields,
        topNDefault: data.top_n_default,
        matched,
        missing: 0,
      };
    }

    const data = perProject.data;
    if (!data) return null;
    const matched = data.records.filter((record) =>
      filters.matches(record.category, record.sub_category),
    );
    const described = matched
      .map((record) => record.attributes)
      .filter((attributes): attributes is ProjectAttributeValues => attributes !== null);

    const fields = Object.fromEntries(
      FIELDS.map((field) => [
        field,
        countBy(
          field === "ecosystems"
            ? described.flatMap((attributes) => attributes.ecosystems)
            : described.map(
                (attributes) => attributes[field as Exclude<ProjectAttributeField, "ecosystems">],
              ),
        ),
      ]),
    ) as Record<ProjectAttributeField, CountRecord[]>;

    return {
      // Activity comes from the rankings payload, so every matched project has it.
      commitActivity: countBy(
        matched.map((record) => (record.active ? ACTIVE_LABEL : INACTIVE_LABEL)),
      ),
      fields,
      topNDefault: data.top_n_default,
      matched: matched.length,
      missing: matched.length - described.length,
    };
  }, [filters, aggregate.data, perProject.data]);

  return { counts, error: filters.active ? perProject.error : aggregate.error };
}

/** Top-N seeded from the payload's own `top_n_default` (30), once it lands. */
function usePayloadTopN(topNDefault: number | undefined, fallback = 25) {
  const [topN, setTopN] = useState(fallback);
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !topNDefault) return;
    seeded.current = true;
    setTopN(topNDefault);
  }, [topNDefault]);
  return [topN, setTopN] as const;
}

function Frame({
  error,
  counts,
  showMissing = true,
  children,
}: {
  error: string | null;
  counts: AttributeCounts | null;
  /** Commit activity has no missing data to report. */
  showMissing?: boolean;
  children: React.ReactNode;
}) {
  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>Project attributes could not be loaded ({error}).</p>
      </div>
    );
  }
  if (!counts) {
    return (
      <div className="viz-state" aria-busy="true" aria-live="polite">
        <p className="viz-state__label">Loading attributes…</p>
      </div>
    );
  }
  if (counts.matched === 0) {
    return (
      <div className="viz-state">
        <p className="viz-state__label">No projects match these filters.</p>
      </div>
    );
  }
  return (
    <>
      {children}
      {showMissing && counts.missing > 0 ? (
        <p className="viz-chart__note" role="status">
          {formatNumber(counts.missing)} of the {formatNumber(counts.matched)}{" "}
          filtered projects have no attribute data in this data snapshot, so
          they are left out.
        </p>
      ) : null}
    </>
  );
}

function toRows(
  records: CountRecord[],
  label: (raw: string) => string = (raw) => raw,
): BarDatum[] {
  return records.map((record) => ({
    key: record.label,
    label: record.label === MISSING ? MISSING_LABEL : label(record.label),
    value: record.count,
  }));
}

/* ------------------------------------------------------ commit activity */

export function CommitActivityChart() {
  const { counts, error } = useAttributeCounts();
  const { exportPart } = useProjectFilters();
  const records = counts?.commitActivity ?? [];

  const rows: BarDatum[] = useMemo(
    () =>
      records.map((record) => ({
        key: record.label,
        // The payload's labels carry their own definition — "Active (Commits
        // in Last 365 Days)" — which the panel description already gives.
        label: record.label.replace(/\s*\(.*\)$/, ""),
        value: record.count,
      })),
    [records],
  );

  const total = records.reduce((sum, record) => sum + record.count, 0);
  const active = records.find((record) => record.label.startsWith("Active"));

  return (
    <Frame error={error} counts={counts} showMissing={false}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Projects"
        labelWidth={90}
        rowHeight={52}
        scale="linear"
        exportName="commit-activity"
          label={"Bar chart: projects active versus inactive in the last 365 days"}
        labelColumn="activity"
        exportParts={[exportPart]}
      />
      {total > 0 ? (
        <p className="viz-chart__note">
          {formatPercent((active?.count ?? 0) / total)} of {formatNumber(total)}{" "}
          {exportPart ? "filtered" : "tracked"} projects have a commit in the
          last 365 days.
        </p>
      ) : null}
    </Frame>
  );
}

/* ------------------------------------------------------ boolean fields */

/** `code_of_conduct` and `contributing_guide` are stored as "True"/"False". */
function yesNo(raw: string): string {
  if (raw === "True") return "Yes";
  if (raw === "False") return "No";
  return raw;
}

function BooleanField({
  field,
}: {
  field: "code_of_conduct" | "contributing_guide";
}) {
  const { counts, error } = useAttributeCounts();
  const { exportPart } = useProjectFilters();
  const rows = useMemo(
    () => toRows(counts?.fields[field] ?? [], yesNo),
    [counts, field],
  );

  return (
    <Frame error={error} counts={counts}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Projects"
        labelWidth={100}
        rowHeight={48}
        scale="linear"
        exportName={field.replace(/_/g, "-")}
          label={`Bar chart: projects publishing a ${field.replace(/_/g, " ")}`}
        labelColumn="present"
        exportParts={[exportPart]}
      />
    </Frame>
  );
}

export function CodeOfConductChart() {
  return <BooleanField field="code_of_conduct" />;
}

export function ContributingGuideChart() {
  return <BooleanField field="contributing_guide" />;
}

/* ------------------------------------------------------------ licenses */

/**
 * SPDX identifiers arrive lower-cased. Segments that are acronyms go up, the
 * rest are capitalised: "bsd-3-clause" → "BSD-3-Clause", "apache-2.0" →
 * "Apache-2.0". Covers all 24 identifiers currently in the data; anything new
 * simply keeps its raw casing, which is visible rather than wrong.
 */
const LICENSE_ACRONYMS = new Set([
  "agpl", "bsd", "by", "cc", "cc0", "epl", "eupl", "gpl", "isc", "lgpl",
  "mit", "mpl", "nc", "nd", "sa",
]);

function licenseLabel(raw: string): string {
  return raw
    .split("-")
    .map((part) =>
      LICENSE_ACRONYMS.has(part)
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("-");
}

export function LicensesChart() {
  const { counts, error } = useAttributeCounts();
  const { exportPart } = useProjectFilters();
  const records = counts?.fields.license ?? [];
  const [topN, setTopN] = usePayloadTopN(counts?.topNDefault);
  const rows = useMemo(
    () => toRows(records.slice(0, topN), licenseLabel),
    [records, topN],
  );

  return (
    <Frame error={error} counts={counts}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={records.length}
              noun="licenses"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Projects"
          labelWidth={170}
          exportName="licenses"
          label={`Bar chart: top ${rows.length} licenses by project count`}
          labelColumn="license"
          exportParts={[exportPart, `top-${topN}`]}
        />
      </div>
    </Frame>
  );
}

/* ----------------------------------------------------------- languages */

export function LanguagesChart() {
  const { counts, error } = useAttributeCounts();
  const { exportPart } = useProjectFilters();
  const records = counts?.fields.language ?? [];
  const [topN, setTopN] = usePayloadTopN(counts?.topNDefault);
  const rows = useMemo(() => toRows(records.slice(0, topN)), [records, topN]);

  return (
    <Frame error={error} counts={counts}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={records.length}
              noun="languages"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Projects"
          labelWidth={170}
          exportName="languages"
          label={`Bar chart: top ${rows.length} languages by project count`}
          labelColumn="language"
          exportParts={[exportPart, `top-${topN}`]}
        />
      </div>
    </Frame>
  );
}

/* ----------------------------------------------------------- platforms */

export function PlatformsChart() {
  const { counts, error } = useAttributeCounts();
  const { exportPart } = useProjectFilters();
  const records = counts?.fields.platform ?? [];
  const [topN, setTopN] = useState(10);
  const rows = useMemo(() => toRows(records.slice(0, topN)), [records, topN]);

  return (
    <Frame error={error} counts={counts}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={records.length}
              noun="platforms"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Projects"
          labelWidth={230}
          exportName="git-platforms"
          label={`Bar chart: top ${rows.length} git platforms by project count`}
          labelColumn="platform"
          exportParts={[exportPart, `top-${topN}`]}
        />
        <p className="viz-chart__note">
          Self-hosted GitLab instances are counted by hostname, so each research
          institute appears separately.
        </p>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------- ecosystems */

export function EcosystemsChart() {
  const { counts, error } = useAttributeCounts();
  const { exportPart } = useProjectFilters();
  const [topN, setTopN] = usePayloadTopN(counts?.topNDefault);

  const records = useMemo(
    // Every non-empty `ecosystems` value in projects.csv ends with a trailing
    // comma, so the pipeline's split yields one empty element per project and
    // counts it as Unknown — one per project. Drawing that would put a bar the
    // size of the whole selection next to the real registries and read as "no
    // ecosystem recorded", which it is not.
    () => (counts?.fields.ecosystems ?? []).filter((r) => r.label !== MISSING),
    [counts],
  );
  const rows = useMemo(() => toRows(records.slice(0, topN)), [records, topN]);

  return (
    <Frame error={error} counts={counts}>
      <div className="viz-root">
        <div className="viz-toolbar">
          <div className="viz-toolbar__controls">
            <TopNField
              value={topN}
              onChange={setTopN}
              max={records.length}
              noun="ecosystems"
            />
          </div>
        </div>
        <HorizontalBarChart
          data={rows}
          valueLabel="Entries"
          labelWidth={150}
          exportName="package-ecosystems"
          label={`Bar chart: top ${rows.length} package ecosystems by entry count`}
          labelColumn="ecosystem"
          exportParts={[exportPart, `top-${topN}`]}
        />
      </div>
    </Frame>
  );
}
