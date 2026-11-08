import { metricCoverage } from "@/lib/charts/coverage";
import { loadOrganizationRankings, loadProjectRankings, loadSummary } from "@/lib/data";
import { loadSiteTotals } from "@/lib/data/site";
import { snapshotOf, type Snapshot } from "@/lib/data/snapshot";
import { METRIC_ORDER, metricValue, type SunburstNode } from "@/lib/sunburst/types";
import type { ProjectRankingRecord, RankingMetricId } from "@/lib/types";

export type MetricCoverage = {
  id: RankingMetricId;
  label: string;
  covered: number;
  total: number;
  share: number;
};

export type MethodologyFacts = {
  snapshot: Snapshot;
  projects: number;
  projectsWithMetrics: number;
  activeProjects: number;
  categories: number;
  subcategories: number;
  organizations: number;
  contributors: number;
  coverage: MetricCoverage[];
  /** The payload's own names — the raw ids read as "Dds". */
  metricLabels: Record<RankingMetricId, string>;
  duplicateNames: number;
  /** Organizations whose record gives no country at all. */
  organizationsWithoutLocation: number;
};

/** Organizations whose record gives no country: the gap every map and country chart carries. */
export async function countOrganizationsWithoutLocation(): Promise<number> {
  const { records } = await loadOrganizationRankings();
  return records.filter((record) => !record.location_country.trim()).length;
}

/** Organizations that record no type: the "Unknown" bar on /organizations. */
export async function countOrganizationsWithoutType(): Promise<number> {
  const { records } = await loadOrganizationRankings();
  return records.filter((record) => !record.form_of_organization.trim()).length;
}

/**
 * Every figure on the methodology page, computed from the payloads.
 *
 * Typed into the prose they would be wrong the first time the `update_data` bot
 * runs — and a page about the data's limitations is the last place that can
 * afford a stale number.
 */
export async function loadMethodologyFacts(): Promise<MethodologyFacts> {
  const [summary, rankings, totals, organizationsWithoutLocation] = await Promise.all([
    loadSummary(),
    loadProjectRankings(),
    loadSiteTotals(),
    countOrganizationsWithoutLocation(),
  ]);
  const records = rankings.records;

  const seen = new Map<string, number>();
  for (const record of records) {
    seen.set(record.name, (seen.get(record.name) ?? 0) + 1);
  }

  const asNode = (record: ProjectRankingRecord) =>
    ({ project: { metrics: record } } as unknown as SunburstNode);

  return {
    snapshot: snapshotOf(summary.as_of),
    projects: totals.projects,
    projectsWithMetrics: totals.projects_with_metrics,
    activeProjects: totals.active_projects,
    categories: totals.categories,
    subcategories: totals.subcategories,
    organizations: totals.organizations,
    contributors: totals.contributors,
    metricLabels: rankings.metric_labels,
    coverage: METRIC_ORDER.map((id) => {
      const result = metricCoverage(records, (record) =>
        metricValue(asNode(record), id),
      );
      return { id, label: rankings.metric_labels[id] ?? id, ...result };
    }).sort((a, b) => a.share - b.share),
    duplicateNames: [...seen.values()].filter((count) => count > 1).length,
    organizationsWithoutLocation,
  };
}
