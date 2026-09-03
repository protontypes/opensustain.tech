import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AnalyticsPayloadMap } from "../types/analytics";
import {
  analyticsPayloadFiles,
  analyticsPayloadUrl,
  type AnalyticsPayloadKey,
} from "./contracts";

const payloadRequiredKeys: {
  [K in AnalyticsPayloadKey]: readonly string[];
} = {
  summary: ["generated_at", "as_of", "totals", "medians", "source"],
  filters: [
    "generated_at",
    "categories",
    "sub_categories",
    "sub_categories_by_category",
    "countries",
    "organization_types",
    "ranking_metrics",
    "bubble_size_metrics",
    "category_colors",
    "bright_score_colors",
    "default_ranking_metric",
    "default_bubble_size_metric",
  ],
  ecosystemSunburst: [
    "generated_at",
    "default_metric",
    "metric_labels",
    "category_colors",
    "root",
  ],
  projectRankings: [
    "generated_at",
    "default_metric",
    "default_top_n",
    "metric_labels",
    "records",
  ],
  projectsOverTime: [
    "generated_at",
    "default_size_metric",
    "size_metric_labels",
    "records",
  ],
  projectAttributes: ["generated_at", "top_n_default", "commit_activity", "fields"],
  organizationsOverview: [
    "generated_at",
    "countries",
    "continent_counts",
    "organization_type_counts",
    "organizations_by_project_count",
  ],
  organizationRankings: [
    "generated_at",
    "default_top_n",
    "default_category",
    "records",
  ],
  projectsByOrganization: [
    "generated_at",
    "minimum_project_count",
    "default_top_n",
    "organizations",
    "root",
  ],
  organizationsBySubcategory: ["generated_at", "subcategories", "root"],
  keywordCounts: ["generated_at", "default_top_n", "max_top_n", "records"],
  topicsHeatmap: [
    "generated_at",
    "default_top_n",
    "max_top_n",
    "sub_categories",
    "topics",
    "topic_totals",
    "matrix",
    "log10_matrix",
    "blacklist",
  ],
  wordcloud: ["generated_at", "image_url", "caption"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertPayloadShape<K extends AnalyticsPayloadKey>(
  key: K,
  value: unknown,
): asserts value is AnalyticsPayloadMap[K] {
  if (!isRecord(value)) {
    throw new Error(`Analytics payload "${key}" is not a JSON object.`);
  }

  const missingKeys = payloadRequiredKeys[key].filter(
    (requiredKey) => !(requiredKey in value),
  );
  if (missingKeys.length > 0) {
    throw new Error(
      `Analytics payload "${key}" is missing required keys: ${missingKeys.join(", ")}`,
    );
  }
}

function dataDir(rootDir = process.cwd()): string {
  return path.join(rootDir, "public", "data");
}

export function analyticsPayloadPath(
  key: AnalyticsPayloadKey,
  rootDir = process.cwd(),
): string {
  return path.join(dataDir(rootDir), analyticsPayloadFiles[key]);
}

export async function loadAnalyticsPayload<K extends AnalyticsPayloadKey>(
  key: K,
  rootDir = process.cwd(),
): Promise<AnalyticsPayloadMap[K]> {
  const raw = await readFile(analyticsPayloadPath(key, rootDir), "utf-8");
  const parsed: unknown = JSON.parse(raw);
  assertPayloadShape(key, parsed);
  return parsed;
}

export async function fetchAnalyticsPayload<K extends AnalyticsPayloadKey>(
  key: K,
  init?: RequestInit,
): Promise<AnalyticsPayloadMap[K]> {
  const response = await fetch(analyticsPayloadUrl(key), init);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch analytics payload "${key}": ${response.status} ${response.statusText}`,
    );
  }

  const parsed: unknown = await response.json();
  assertPayloadShape(key, parsed);
  return parsed;
}

export function loadAllAnalyticsPayloads(rootDir = process.cwd()) {
  return Promise.all([
    loadAnalyticsPayload("summary", rootDir),
    loadAnalyticsPayload("filters", rootDir),
    loadAnalyticsPayload("ecosystemSunburst", rootDir),
    loadAnalyticsPayload("projectRankings", rootDir),
    loadAnalyticsPayload("projectsOverTime", rootDir),
    loadAnalyticsPayload("projectAttributes", rootDir),
    loadAnalyticsPayload("organizationsOverview", rootDir),
    loadAnalyticsPayload("organizationRankings", rootDir),
    loadAnalyticsPayload("projectsByOrganization", rootDir),
    loadAnalyticsPayload("organizationsBySubcategory", rootDir),
    loadAnalyticsPayload("keywordCounts", rootDir),
    loadAnalyticsPayload("topicsHeatmap", rootDir),
    loadAnalyticsPayload("wordcloud", rootDir),
  ]).then(
    ([
      summary,
      filters,
      ecosystemSunburst,
      projectRankings,
      projectsOverTime,
      projectAttributes,
      organizationsOverview,
      organizationRankings,
      projectsByOrganization,
      organizationsBySubcategory,
      keywordCounts,
      topicsHeatmap,
      wordcloud,
    ]) => ({
      summary,
      filters,
      ecosystemSunburst,
      projectRankings,
      projectsOverTime,
      projectAttributes,
      organizationsOverview,
      organizationRankings,
      projectsByOrganization,
      organizationsBySubcategory,
      keywordCounts,
      topicsHeatmap,
      wordcloud,
    }),
  );
}

export const loadSummary = (rootDir?: string) =>
  loadAnalyticsPayload("summary", rootDir);

export const loadFilters = (rootDir?: string) =>
  loadAnalyticsPayload("filters", rootDir);

export const loadEcosystemSunburst = (rootDir?: string) =>
  loadAnalyticsPayload("ecosystemSunburst", rootDir);

export const loadProjectRankings = (rootDir?: string) =>
  loadAnalyticsPayload("projectRankings", rootDir);

export const loadProjectsOverTime = (rootDir?: string) =>
  loadAnalyticsPayload("projectsOverTime", rootDir);

export const loadProjectAttributes = (rootDir?: string) =>
  loadAnalyticsPayload("projectAttributes", rootDir);

export const loadOrganizationsOverview = (rootDir?: string) =>
  loadAnalyticsPayload("organizationsOverview", rootDir);

export const loadOrganizationRankings = (rootDir?: string) =>
  loadAnalyticsPayload("organizationRankings", rootDir);

export const loadProjectsByOrganization = (rootDir?: string) =>
  loadAnalyticsPayload("projectsByOrganization", rootDir);

export const loadOrganizationsBySubcategory = (rootDir?: string) =>
  loadAnalyticsPayload("organizationsBySubcategory", rootDir);

export const loadKeywordCounts = (rootDir?: string) =>
  loadAnalyticsPayload("keywordCounts", rootDir);

export const loadTopicsHeatmap = (rootDir?: string) =>
  loadAnalyticsPayload("topicsHeatmap", rootDir);

export const loadWordcloud = (rootDir?: string) =>
  loadAnalyticsPayload("wordcloud", rootDir);
