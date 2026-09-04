"use client";

import { useEffect, useRef, useState } from "react";

import { formatNumber } from "@/lib/format";
import type { RankingMetricId } from "@/lib/types";
import { categoryColor } from "@/lib/sunburst/color";
import { METRIC_ORDER } from "@/lib/sunburst/types";
import { ExportMenu } from "../export-menu";
import type { ActivityFilter, SunburstNode } from "@/lib/sunburst/types";

type Props = {
  trail: SunburstNode[];
  metric: RankingMetricId;
  metricLabels: Record<RankingMetricId, string>;
  activity: ActivityFilter;
  totals: { all: number; active: number };
  query: string;
  canReset: boolean;
  categoryColors: Record<string, string>;
  onMetric: (metric: RankingMetricId) => void;
  onActivity: (activity: ActivityFilter) => void;
  onQuery: (query: string) => void;
  onZoomTo: (index: number) => void;
  onReset: () => void;
  onExport: (kind: "png" | "svg" | "csv") => void;
};

export function SunburstToolbar({
  trail,
  metric,
  metricLabels,
  activity,
  totals,
  query,
  canReset,
  categoryColors,
  onMetric,
  onActivity,
  onQuery,
  onZoomTo,
  onReset,
  onExport,
}: Props) {
  const [draft, setDraft] = useState(query);

  // Held in a ref so the debounce depends only on what the user typed. Keying
  // it on the callback identity restarted the timer on every parent render,
  // which with an inline arrow prop meant it never settled.
  const onQueryRef = useRef(onQuery);
  onQueryRef.current = onQuery;

  // Debounce so typing dims the ring smoothly instead of on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => onQueryRef.current(draft.trim()), 180);
    return () => clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    setDraft((current) => (query === "" && current !== "" ? "" : current));
  }, [query]);

  return (
    <div className="viz-toolbar">
      <nav className="viz-breadcrumb" aria-label="Chart zoom level">
        {trail.map((node, index) => {
          const isLast = index === trail.length - 1;
          const label = index === 0 ? "Ecosystem" : node.name;
          return (
            <span key={node.id} className="viz-breadcrumb__item">
              {index > 0 ? (
                <span className="viz-breadcrumb__sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              <button
                type="button"
                className="viz-breadcrumb__link"
                aria-current={isLast ? "location" : undefined}
                disabled={isLast}
                onClick={() => onZoomTo(index)}
              >
                {node.kind === "category" ? (
                  <span
                    className="viz-breadcrumb__swatch"
                    style={{
                      background: categoryColor(node.category, categoryColors),
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                {label}
              </button>
            </span>
          );
        })}
      </nav>

      <div className="viz-toolbar__controls">
        <div
          className="viz-segmented"
          role="group"
          aria-label="Project activity filter"
        >
          <button
            type="button"
            aria-pressed={activity === "all"}
            onClick={() => onActivity("all")}
          >
            All <em>{formatNumber(totals.all)}</em>
          </button>
          <button
            type="button"
            aria-pressed={activity === "active"}
            onClick={() => onActivity("active")}
          >
            Active <em>{formatNumber(totals.active)}</em>
          </button>
        </div>

        <label className="viz-field viz-field--select">
          <span className="viz-field__label">Color by</span>
          <select
            value={metric}
            onChange={(event) =>
              onMetric(event.target.value as RankingMetricId)
            }
          >
            {METRIC_ORDER.map((id) => (
              <option key={id} value={id}>
                {metricLabels[id] ?? id}
              </option>
            ))}
          </select>
        </label>

        <label className="viz-field viz-field--search">
          <span className="viz-field__label">Search</span>
          <input
            type="search"
            value={draft}
            placeholder="Name, description, sub-category"
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="viz-button"
          onClick={onReset}
          disabled={!canReset}
        >
          Reset
        </button>

        <ExportMenu formats={["png", "svg", "csv"]} onExport={onExport} />
      </div>
    </div>
  );
}
