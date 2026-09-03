"use client";

import { useMemo, useState } from "react";

import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { formatNumber, formatPercent } from "@/lib/format";
import type { CountRecord, ProjectAttributesPayload } from "@/lib/types";

import { HorizontalBarChart, type BarDatum } from "./horizontal-bar-chart";
import { TopNField } from "./top-n-field";

/** The pipeline's stand-in for a missing value, in every field it counts. */
const MISSING = "Unknown";
const MISSING_LABEL = "Not recorded";

function useAttributes() {
  return useAnalyticsPayload<ProjectAttributesPayload>("projectAttributes");
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
        <p>Project attributes could not be loaded ({error}).</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="viz-state" aria-busy="true" aria-live="polite">
        <p className="viz-state__label">Loading attributes…</p>
      </div>
    );
  }
  return <>{children}</>;
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
  const { data, error } = useAttributes();
  const records = data?.commit_activity ?? [];

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
    <Frame error={error} data={data}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Projects"
        labelWidth={90}
        rowHeight={52}
        scale="linear"
      />
      {active && total > 0 ? (
        <p className="viz-chart__note">
          {formatPercent(active.count / total)} of {formatNumber(total)}{" "}
          tracked projects have a commit in the last 365 days.
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
  const { data, error } = useAttributes();
  const rows = useMemo(
    () => toRows(data?.fields[field] ?? [], yesNo),
    [data, field],
  );

  return (
    <Frame error={error} data={data}>
      <HorizontalBarChart
        data={rows}
        valueLabel="Projects"
        labelWidth={100}
        rowHeight={48}
        scale="linear"
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
  const { data, error } = useAttributes();
  const records = data?.fields.license ?? [];
  const [topN, setTopN] = useState(25);
  const rows = useMemo(
    () => toRows(records.slice(0, topN), licenseLabel),
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
              noun="licenses"
            />
          </div>
        </div>
        <HorizontalBarChart data={rows} valueLabel="Projects" labelWidth={170} />
      </div>
    </Frame>
  );
}

/* ----------------------------------------------------------- languages */

export function LanguagesChart() {
  const { data, error } = useAttributes();
  const records = data?.fields.language ?? [];
  const [topN, setTopN] = useState(25);
  const rows = useMemo(() => toRows(records.slice(0, topN)), [records, topN]);

  return (
    <Frame error={error} data={data}>
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
        <HorizontalBarChart data={rows} valueLabel="Projects" labelWidth={170} />
      </div>
    </Frame>
  );
}

/* ----------------------------------------------------------- platforms */

export function PlatformsChart() {
  const { data, error } = useAttributes();
  const records = data?.fields.platform ?? [];
  const [topN, setTopN] = useState(10);
  const rows = useMemo(() => toRows(records.slice(0, topN)), [records, topN]);

  return (
    <Frame error={error} data={data}>
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
        <HorizontalBarChart data={rows} valueLabel="Projects" labelWidth={230} />
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
  const { data, error } = useAttributes();
  const [topN, setTopN] = useState(25);

  const records = useMemo(
    // Every non-empty `ecosystems` value in projects.csv ends with a trailing
    // comma, so the payload's split yields one empty element per project and
    // counts it as Unknown — exactly 2,691 of them, one per project. Drawing
    // that would put a bar the size of the whole dataset next to the real
    // registries and read as "no ecosystem recorded", which it is not.
    () => (data?.fields.ecosystems ?? []).filter((r) => r.label !== MISSING),
    [data],
  );
  const rows = useMemo(() => toRows(records.slice(0, topN)), [records, topN]);

  return (
    <Frame error={error} data={data}>
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
        <HorizontalBarChart data={rows} valueLabel="Entries" labelWidth={150} />
        <p className="viz-chart__note">
          Counts are registry entries, not projects: a project can publish to
          several registries, and the source lists a registry once per package,
          so these run well above the project total. An empty bucket produced by
          a trailing comma in the source is excluded.
        </p>
      </div>
    </Frame>
  );
}
