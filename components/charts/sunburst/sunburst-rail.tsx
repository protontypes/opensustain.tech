"use client";

import { formatDecimal, formatNumber } from "@/lib/format";
import type { RankingMetricId } from "@/lib/types";
import { binFillsInHue, categoryColor, type Bins } from "@/lib/sunburst/color";
import { METRIC_ORDER, type SunburstNode } from "@/lib/sunburst/types";

function formatBound(metric: RankingMetricId, value: number): string {
  if (metric === "dds") return formatDecimal(value, 2);
  if (metric === "score" || metric === "total_score_combined") {
    return formatDecimal(value, 1);
  }
  return formatNumber(Math.round(value));
}

export function SunburstColorBar({
  metric,
  metricLabels,
  bins,
  hue,
  hueLabel,
}: {
  metric: RankingMetricId;
  metricLabels: Record<RankingMetricId, string>;
  bins: Bins;
  /** The hue the bar is drawn in — a focused category's, or the brand primary. */
  hue: string;
  hueLabel: string | null;
}) {
  const fills = binFillsInHue(hue, bins.count);
  const bounds = [bins.min, ...bins.thresholds, bins.max];

  return (
    <div className="viz-colorbar">
      <p className="viz-rail__heading">{metricLabels[metric] ?? metric}</p>
      {bins.count > 0 ? (
        <>
          <div className="viz-colorbar__track">
            {fills.map((fill, index) => (
              <span
                key={fill + String(index)}
                style={{ background: fill }}
                className="viz-colorbar__segment"
              />
            ))}
          </div>
          <div className="viz-colorbar__ticks" aria-hidden="true">
            {bounds.map((bound, index) => (
              <span key={`${bound}-${index}`}>{formatBound(metric, bound)}</span>
            ))}
          </div>
          <p className="viz-colorbar__caption">
            Equal-count bands across the {formatNumber(bins.covered)} projects
            that report this metric, shaded{" "}
            {hueLabel
              ? `within ${hueLabel}'s colour`
              : "within each category's own colour"}
            .
          </p>
        </>
      ) : (
        <p className="viz-colorbar__caption">
          No project reports a value for this metric.
        </p>
      )}
      {bins.zeros > 0 ? (
        <p className="viz-colorbar__null">
          <span
            className="viz-swatch"
            style={{ background: "var(--viz-null)" }}
            aria-hidden="true"
          />
          {formatNumber(bins.zeros)} with no value
        </p>
      ) : null}
    </div>
  );
}

export function SunburstLegend({
  categories,
  isolated,
  categoryColors,
  onToggle,
  onClear,
}: {
  categories: SunburstNode[];
  isolated: string[];
  categoryColors: Record<string, string>;
  onToggle: (name: string) => void;
  onClear: () => void;
}) {
  const isolating = isolated.length > 0;
  const ordered = [...categories].sort(
    (a, b) => b.visibleLeaves - a.visibleLeaves,
  );

  return (
    <div className="viz-legend">
      <div className="viz-rail__head">
        <p className="viz-rail__heading">Categories</p>
        {isolating ? (
          <button type="button" className="viz-link" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
      <div className="viz-legend__chips" role="group" aria-label="Filter by category">
        {ordered.map((category) => {
          const on = !isolating || isolated.includes(category.name);
          return (
            <button
              key={category.id}
              type="button"
              className={on ? "viz-chip" : "viz-chip is-off"}
              aria-pressed={isolating ? isolated.includes(category.name) : false}
              onClick={() => onToggle(category.name)}
            >
              <span
                className="viz-swatch"
                style={{
                  background: categoryColor(category.name, categoryColors),
                }}
                aria-hidden="true"
              />
              <span className="viz-chip__name">{category.name}</span>
              <span className="viz-chip__count">
                {formatNumber(category.visibleLeaves)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SunburstDetails({
  node,
  metricLabels,
  onClear,
}: {
  node: SunburstNode;
  metricLabels: Record<RankingMetricId, string>;
  onClear: () => void;
}) {
  const project = node.project!;
  return (
    <div className="viz-details">
      <div className="viz-rail__head">
        <p className="viz-rail__heading">Selected project</p>
        <button type="button" className="viz-link" onClick={onClear}>
          Close
        </button>
      </div>
      {/* Grouped so the grid has exactly two children. Left un-wrapped, the
          five elements auto-placed alternately across the two columns, which
          is how the category path ended up floating above the metrics. */}
      <div className="viz-details__main">
        <h3 className="viz-details__name">{project.name}</h3>
        <p className="viz-details__path">
          {project.category} <span aria-hidden="true">›</span>{" "}
          {project.sub_category}
        </p>
        {project.description ? (
          <p className="viz-details__description">{project.description}</p>
        ) : null}
        <div className="viz-details__actions">
          {project.url ? (
            <a
              className="viz-button viz-button--primary"
              href={project.url}
              target="_blank"
              rel="noreferrer"
            >
              Repository
            </a>
          ) : null}
          {project.homepage ? (
            <a
              className="viz-button"
              href={project.homepage}
              target="_blank"
              rel="noreferrer"
            >
              Homepage
            </a>
          ) : null}
        </div>
      </div>
      <dl className="viz-details__metrics">
        {METRIC_ORDER.map((id) => (
          <div key={id}>
            <dt>{metricLabels[id] ?? id}</dt>
            <dd>
              {id === "dds"
                ? formatDecimal(project.metrics[id] ?? 0, 3)
                : id === "score" || id === "total_score_combined"
                  ? formatDecimal(project.metrics[id] ?? 0, 2)
                  : formatNumber(project.metrics[id] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
