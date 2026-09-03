"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { formatDecimal, formatNumber } from "@/lib/format";
import type { RankingMetricId } from "@/lib/types";
import { METRIC_ORDER, type SunburstNode } from "@/lib/sunburst/types";

/** Per-metric formatting: counts, scores and ratios each read differently. */
function formatMetric(metric: RankingMetricId, value: number): string {
  if (metric === "dds") return formatDecimal(value, 3);
  if (metric === "score" || metric === "total_score_combined") {
    return formatDecimal(value, 2);
  }
  return formatNumber(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  node: SunburstNode | null;
  x: number;
  y: number;
  metric: RankingMetricId;
  metricLabels: Record<RankingMetricId, string>;
};

export function SunburstTooltip({ node, x, y, metric, metricLabels }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !node) return null;

  // Flip across the cursor near the viewport edges so the panel never clips.
  const width = 330;
  const flipX = x + width + 28 > window.innerWidth;
  const left = flipX ? Math.max(12, x - width - 20) : x + 20;
  const top = Math.min(Math.max(12, y - 24), window.innerHeight - 320);

  const project = node.project;

  return createPortal(
    <div className="viz-tooltip" style={{ left, top }} role="tooltip">
      <p className="viz-tooltip__title">{node.name}</p>

      {project ? (
        <>
          <p className="viz-tooltip__path">
            {project.category} <span aria-hidden="true">›</span>{" "}
            {project.sub_category}
          </p>
          <p
            className={
              project.is_active_last_365d
                ? "viz-tooltip__status viz-tooltip__status--active"
                : "viz-tooltip__status"
            }
          >
            {project.is_active_last_365d ? "Active" : "Dormant"} · last commit{" "}
            {formatDate(project.latest_commit_activity)}
          </p>
          {project.description ? (
            <p className="viz-tooltip__description">{project.description}</p>
          ) : null}
          <dl className="viz-tooltip__metrics">
            {METRIC_ORDER.map((id) => (
              <div
                key={id}
                className={
                  id === metric
                    ? "viz-tooltip__row viz-tooltip__row--active"
                    : "viz-tooltip__row"
                }
              >
                <dt>{metricLabels[id] ?? id}</dt>
                <dd>{formatMetric(id, project.metrics[id] ?? 0)}</dd>
              </div>
            ))}
          </dl>
          <p className="viz-tooltip__hint">
            Click to select · {"⌘"}/Ctrl-click to open the repository
          </p>
        </>
      ) : (
        <>
          <p className="viz-tooltip__path">
            {node.kind === "category" ? "Category" : node.category}
          </p>
          <dl className="viz-tooltip__metrics">
            <div className="viz-tooltip__row viz-tooltip__row--active">
              <dt>Projects shown</dt>
              <dd>{formatNumber(node.visibleLeaves)}</dd>
            </div>
            <div className="viz-tooltip__row">
              <dt>Projects total</dt>
              <dd>{formatNumber(node.totalLeaves)}</dd>
            </div>
            <div className="viz-tooltip__row">
              <dt>Active last year</dt>
              <dd>{formatNumber(node.activeLeaves)}</dd>
            </div>
            {node.kind === "category" ? (
              <div className="viz-tooltip__row">
                <dt>Sub-categories</dt>
                <dd>{formatNumber(node.children.length)}</dd>
              </div>
            ) : null}
          </dl>
          <p className="viz-tooltip__hint">Click to zoom in</p>
        </>
      )}
    </div>,
    document.body,
  );
}
