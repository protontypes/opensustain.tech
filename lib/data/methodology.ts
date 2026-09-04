import { metricCoverage } from "@/lib/charts/coverage";
import { loadProjectRankings, loadSummary } from "@/lib/data";
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
  activeProjects: number;
  organizations: number;
  contributors: number;
  coverage: MetricCoverage[];
  /** The payload's own names — the raw ids read as "Dds". */
  metricLabels: Record<RankingMetricId, string>;
  duplicateNames: number;
};

/**
 * Every figure on the methodology page, computed from the payloads.
 *
 * Typed into the prose they would be wrong the first time the `update_data` bot
 * runs — and a page about the data's limitations is the last place that can
 * afford a stale number.
 */
export async function loadMethodologyFacts(): Promise<MethodologyFacts> {
  const [summary, rankings] = await Promise.all([
    loadSummary(),
    loadProjectRankings(),
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
    projects: summary.totals.projects,
    activeProjects: summary.totals.active_projects,
    organizations: summary.totals.organizations,
    contributors: summary.totals.contributors,
    metricLabels: rankings.metric_labels,
    coverage: METRIC_ORDER.map((id) => {
      const result = metricCoverage(records, (record) =>
        metricValue(asNode(record), id),
      );
      return { id, label: rankings.metric_labels[id] ?? id, ...result };
    }).sort((a, b) => a.share - b.share),
    duplicateNames: [...seen.values()].filter((count) => count > 1).length,
  };
}
