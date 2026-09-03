"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { formatNumber } from "@/lib/format";
import type { SunburstNode } from "@/lib/sunburst/types";

/**
 * Tooltip for the organization and sub-category charts.
 *
 * Entirely driven by `node.detail`, so a chart describes its own nodes when it
 * builds its tree rather than this component switching on `kind`. The ecosystem
 * chart keeps its own tooltip — it renders metric bins, which no other chart has.
 */
export function SunburstNodeTooltip({
  node,
  x,
  y,
}: {
  node: SunburstNode | null;
  x: number;
  y: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !node) return null;

  const width = 300;
  const flipX = x + width + 28 > window.innerWidth;
  const left = flipX ? Math.max(12, x - width - 20) : x + 20;
  const top = Math.min(Math.max(12, y - 24), window.innerHeight - 240);
  const detail = node.detail;
  const stats = detail?.stats ?? [];

  return createPortal(
    <div className="viz-tooltip" style={{ left, top, width }} role="tooltip">
      <p className="viz-tooltip__title">{node.name}</p>
      {detail?.subtitle ? (
        <p className="viz-tooltip__path">{detail.subtitle}</p>
      ) : null}
      <dl className="viz-tooltip__metrics">
        {/* Live because filtering changes it; a static stat cannot carry it. */}
        {detail?.liveCountLabel ? (
          <div className="viz-tooltip__row viz-tooltip__row--active">
            <dt>{detail.liveCountLabel}</dt>
            <dd>{formatNumber(node.visibleLeaves)}</dd>
          </div>
        ) : null}
        {stats.map((stat) => (
          <div key={stat.label} className="viz-tooltip__row">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      {detail?.hint ? <p className="viz-tooltip__hint">{detail.hint}</p> : null}
    </div>,
    document.body,
  );
}
