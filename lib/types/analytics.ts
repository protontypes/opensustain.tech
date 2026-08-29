export type IsoDateString = string;

export type RankingMetricId =
  | "contributors"
  | "citations"
  | "total_commits"
  | "total_number_of_dependencies"
  | "stars"
  | "score"
  | "dds"
  | "downloads_last_month"
  | "total_score_combined";

export type BubbleSizeMetricId =
  | "contributors"
  | "stars"
  | "downloads_last_month"
  | "total_commits"
  | "total_number_of_dependencies"
  | "citations";

export type ProjectAttributeField =
  | "code_of_conduct"
  | "contributing_guide"
  | "license"
  | "language"
  | "ecosystems"
  | "platform";

export interface MetricOption<TId extends string> {
  id: TId;
  label: string;
}

export interface CountRecord {
  label: string;
  count: number;
}

export interface ProjectMetrics {
  contributors: number;
  citations: number;
  total_commits: number;
  total_number_of_dependencies: number;
  stars: number;
  score: number;
  dds: number;
  downloads_last_month: number;
  total_score_combined: number;
}

export interface ProjectSizeMetrics {
  contributors: number;
  stars: number;
  downloads_last_month: number;
  total_commits: number;
  total_number_of_dependencies: number;
  citations: number;
}

export interface SummaryPayload {
  generated_at: IsoDateString;
  as_of: IsoDateString;
  totals: {
    projects: number;
    active_projects: number;
    organizations: number;
    contributors: number;
  };
  medians: {
    project_age_years: number;
    stars: number;
    dds: number;
    contributors: number;
    total_commits: number;
  };
  source: {
    projects_rows: number;
    organizations_rows: number;
  };
}

export interface FiltersPayload {
  generated_at: IsoDateString;
  categories: string[];
  sub_categories: string[];
  sub_categories_by_category: Record<string, string[]>;
  countries: string[];
  organization_types: string[];
  ranking_metrics: MetricOption<RankingMetricId>[];
  bubble_size_metrics: MetricOption<BubbleSizeMetricId>[];
  category_colors: Record<string, string>;
  bright_score_colors: string[];
  default_ranking_metric: RankingMetricId;
  default_bubble_size_metric: BubbleSizeMetricId;
}

export interface EcosystemProjectNode {
  name: string;
  kind: "project";
  value: number;
  url: string;
  homepage: string;
  description: string;
  category: string;
  sub_category: string;
  is_active_last_365d: boolean;
  latest_commit_activity: IsoDateString | null;
  metrics: ProjectMetrics;
}

export interface EcosystemSubCategoryNode {
  name: string;
  kind: "sub_category";
  children: EcosystemProjectNode[];
}

export interface EcosystemCategoryNode {
  name: string;
  kind: "category";
  color?: string;
  children: EcosystemSubCategoryNode[];
}

export interface EcosystemRootNode {
  name: string;
  kind: "root";
  children: EcosystemCategoryNode[];
}

export interface EcosystemSunburstPayload {
  generated_at: IsoDateString;
  default_metric: RankingMetricId;
  metric_labels: Record<RankingMetricId, string>;
  category_colors: Record<string, string>;
  root: EcosystemRootNode;
}

export interface ProjectRankingRecord extends ProjectMetrics {
  name: string;
  url: string;
  description: string;
  avatar_url: string;
  category: string;
  sub_category: string;
  latest_commit_activity: IsoDateString | null;
  is_active_last_365d: boolean;
}

export interface ProjectRankingsPayload {
  generated_at: IsoDateString;
  default_metric: RankingMetricId;
  default_top_n: number;
  metric_labels: Record<RankingMetricId, string>;
  records: ProjectRankingRecord[];
}

export interface ProjectsOverTimeRecord {
  name: string;
  url: string;
  description: string;
  category: string;
  sub_category: string;
  project_age_years: number;
  is_active_last_365d: boolean;
  size_metrics: ProjectSizeMetrics;
}

export interface ProjectsOverTimePayload {
  generated_at: IsoDateString;
  default_size_metric: BubbleSizeMetricId;
  size_metric_labels: Record<BubbleSizeMetricId, string>;
  records: ProjectsOverTimeRecord[];
}

export interface ProjectAttributesPayload {
  generated_at: IsoDateString;
  top_n_default: number;
  commit_activity: CountRecord[];
  fields: Record<ProjectAttributeField, CountRecord[]>;
}

export interface OrganizationCountryRecord {
  iso_alpha: string;
  country_name: string;
  map_eligible: boolean;
  organization_count: number;
  total_projects: number;
}

export interface OrganizationContinentRecord {
  continent: string;
  count: number;
}

export interface OrganizationTypeRecord {
  form_of_organization: string;
  count: number;
}

export interface OrganizationProjectCountRecord {
  organization_name: string;
  organization_url: string;
  organization_description: string;
  organization_icon_url: string;
  location_country: string;
  form_of_organization: string;
  total_listed_projects_in_organization: number;
}

export interface OrganizationsOverviewPayload {
  generated_at: IsoDateString;
  countries: OrganizationCountryRecord[];
  continent_counts: OrganizationContinentRecord[];
  organization_type_counts: OrganizationTypeRecord[];
  organizations_by_project_count: OrganizationProjectCountRecord[];
}

export interface OrganizationCategoryBreakdownRecord {
  category: string;
  total_score: number;
  project_count: number;
}

export interface OrganizationRankingRecord {
  organization_name: string;
  organization_url: string;
  organization_description: string;
  organization_icon_url: string;
  location_country: string;
  form_of_organization: string;
  listed_project_count: number;
  matched_project_count: number;
  total_score: number;
  category_breakdown: OrganizationCategoryBreakdownRecord[];
}

export interface OrganizationRankingsPayload {
  generated_at: IsoDateString;
  default_top_n: number;
  default_category: string;
  records: OrganizationRankingRecord[];
}

export interface OrganizationProjectRecord {
  name: string;
  url: string;
  category: string;
  sub_category: string;
  total_score_combined: number;
}

export interface ProjectsByOrganizationRecord {
  organization_name: string;
  organization_url: string;
  organization_description: string;
  organization_icon_url: string;
  project_count: number;
  total_score: number;
  projects: OrganizationProjectRecord[];
}

export interface ProjectsByOrganizationProjectNode {
  name: string;
  kind: "project";
  value: number;
  url: string;
  category: string;
  sub_category: string;
  total_score_combined: number;
}

export interface ProjectsByOrganizationOrgNode {
  name: string;
  kind: "organization";
  value: number;
  url: string;
  total_score: number;
  children: ProjectsByOrganizationProjectNode[];
}

export interface ProjectsByOrganizationRootNode {
  name: string;
  kind: "root";
  children: ProjectsByOrganizationOrgNode[];
}

export interface ProjectsByOrganizationPayload {
  generated_at: IsoDateString;
  minimum_project_count: number;
  default_top_n: number;
  organizations: ProjectsByOrganizationRecord[];
  root: ProjectsByOrganizationRootNode;
}

export interface OrganizationsBySubcategoryOrganizationRecord {
  organization_name: string;
  organization_url: string;
  location_country: string;
  form_of_organization: string;
}

export interface OrganizationsBySubcategoryRecord {
  sub_category: string;
  organization_count: number;
  organizations: OrganizationsBySubcategoryOrganizationRecord[];
}

export interface OrganizationsBySubcategoryOrgNode {
  name: string;
  kind: "organization";
  value: number;
  url: string;
}

export interface OrganizationsBySubcategoryNode {
  name: string;
  kind: "sub_category";
  value: number;
  children: OrganizationsBySubcategoryOrgNode[];
}

export interface OrganizationsBySubcategoryRootNode {
  name: string;
  kind: "root";
  children: OrganizationsBySubcategoryNode[];
}

export interface OrganizationsBySubcategoryPayload {
  generated_at: IsoDateString;
  subcategories: OrganizationsBySubcategoryRecord[];
  root: OrganizationsBySubcategoryRootNode;
}

export interface KeywordCountRecord {
  keyword: string;
  count: number;
}

export interface KeywordCountsPayload {
  generated_at: IsoDateString;
  default_top_n: number;
  max_top_n: number;
  records: KeywordCountRecord[];
}

export interface TopicsHeatmapPayload {
  generated_at: IsoDateString;
  default_top_n: number;
  max_top_n: number;
  sub_categories: string[];
  topics: string[];
  topic_totals: number[];
  matrix: number[][];
  log10_matrix: number[][];
  blacklist: string[];
}

export interface WordcloudPayload {
  generated_at: IsoDateString;
  image_url: string;
  caption: string;
}

export interface AnalyticsPayloadMap {
  summary: SummaryPayload;
  filters: FiltersPayload;
  ecosystemSunburst: EcosystemSunburstPayload;
  projectRankings: ProjectRankingsPayload;
  projectsOverTime: ProjectsOverTimePayload;
  projectAttributes: ProjectAttributesPayload;
  organizationsOverview: OrganizationsOverviewPayload;
  organizationRankings: OrganizationRankingsPayload;
  projectsByOrganization: ProjectsByOrganizationPayload;
  organizationsBySubcategory: OrganizationsBySubcategoryPayload;
  keywordCounts: KeywordCountsPayload;
  topicsHeatmap: TopicsHeatmapPayload;
  wordcloud: WordcloudPayload;
}
