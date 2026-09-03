import type {
  EcosystemProjectNode,
  EcosystemSunburstPayload,
  ProjectMetrics,
  RankingMetricId,
} from "@/lib/types";

/** Metric ids in the order the toolbar offers them (coverage descending). */
export const METRIC_ORDER: RankingMetricId[] = [
  "total_score_combined",
  "contributors",
  "stars",
  "score",
  "total_commits",
  "dds",
  "total_number_of_dependencies",
  "downloads_last_month",
  "citations",
];

export type NodeKind =
  | "root"
  | "category"
  | "sub_category"
  | "organization"
  | "project";

/**
 * One node of the flattened tree. `project` is only present on leaves; branches
 * carry live counts so the legend, hole and tooltips can describe them without
 * walking children again.
 */
export type SunburstNode = {
  id: string;
  name: string;
  kind: NodeKind;
  depth: number;
  /** Category this node belongs to — its own name for a category node. */
  category: string;
  project?: EcosystemProjectNode;
  /**
   * Free-form payload for trees that are not the ecosystem hierarchy — the
   * organization sunburst reuses this whole layer with a different shape.
   */
  detail?: {
    url?: string;
    /**
     * The line under the tooltip title — what this node is, in this chart's
     * terms ("Organization · mostly Energy Systems").
     */
    subtitle?: string;
    stats?: { label: string; value: string }[];
    /** Facets the chart filters on. Empty string means the source recorded none. */
    country?: string;
    orgType?: string;
    /**
     * Label for a row carrying the node's *live* `visibleLeaves`, which the
     * static `stats` cannot express because filtering changes it.
     */
    liveCountLabel?: string;
    /** Footer line: what a click here will do. */
    hint?: string;
  };
  children: SunburstNode[];
  parent: SunburstNode | null;
  /** Leaves under this node that pass the current filters. */
  visibleLeaves: number;
  /** Leaves under this node in total, before filtering. */
  totalLeaves: number;
  activeLeaves: number;
};

/** A node's angular + radial extent, in radians and 0..1 of the outer radius. */
export type Rect = { x0: number; x1: number; y0: number; y1: number };

export type ActivityFilter = "all" | "active";

export type ViewState = {
  metric: RankingMetricId;
  activity: ActivityFilter;
  /** Ids from root down to the zoomed node; empty means the root is focused. */
  zoomPath: string[];
  /** Category names isolated via the legend; empty means show everything. */
  isolated: string[];
  query: string;
  selectedId: string | null;
};

export const INITIAL_VIEW: ViewState = {
  metric: "total_score_combined",
  activity: "active",
  zoomPath: [],
  isolated: [],
  query: "",
  selectedId: null,
};

export function metricValue(
  node: SunburstNode,
  metric: RankingMetricId,
): number | null {
  const metrics = node.project?.metrics as ProjectMetrics | undefined;
  if (!metrics) return null;
  const raw = metrics[metric];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export type { EcosystemSunburstPayload, RankingMetricId };
