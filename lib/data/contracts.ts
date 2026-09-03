import type { AnalyticsPayloadMap } from "../types/analytics";

export const analyticsPayloadFiles: {
  [K in keyof AnalyticsPayloadMap]: `${string}.json`;
} = {
  summary: "summary.json",
  filters: "filters.json",
  ecosystemSunburst: "ecosystem-sunburst.json",
  projectRankings: "project-rankings.json",
  projectsOverTime: "projects-over-time.json",
  projectAttributes: "project-attributes.json",
  organizationsOverview: "organizations-overview.json",
  organizationRankings: "organization-rankings.json",
  projectsByOrganization: "projects-by-organization.json",
  organizationsBySubcategory: "organizations-by-subcategory.json",
  keywordCounts: "keyword-counts.json",
  topicsHeatmap: "topics-heatmap.json",
  wordcloud: "wordcloud.json",
};

export type AnalyticsPayloadKey = keyof typeof analyticsPayloadFiles;

/**
 * Public URL of a payload under /data.
 *
 * Lives here rather than in loaders.ts so client components can import it
 * without pulling `node:fs` into the browser bundle.
 */
export function analyticsPayloadUrl(key: AnalyticsPayloadKey): string {
  return `/data/${analyticsPayloadFiles[key]}`;
}
