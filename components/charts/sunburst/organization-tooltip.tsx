"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { formatNumber } from "@/lib/format";
import type { SunburstNode } from "@/lib/sunburst/types";

export function OrganizationTooltip({
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
  const stats = node.detail?.stats ?? [];

  return createPortal(
    <div className="viz-tooltip" style={{ left, top, width }} role="tooltip">
      <p className="viz-tooltip__title">{node.name}</p>
      <p className="viz-tooltip__path">
        {node.kind === "organization"
          ? `Organization${node.category ? ` · mostly ${node.category}` : ""}`
          : (node.detail?.subtitle ?? "Project")}
      </p>
      <dl className="viz-tooltip__metrics">
        {node.kind === "organization" ? (
          <div className="viz-tooltip__row viz-tooltip__row--active">
            <dt>Projects shown</dt>
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
      <p className="viz-tooltip__hint">
        {node.kind === "organization"
          ? "Click to zoom in"
          : "Click to select · ⌘/Ctrl-click to open the repository"}
      </p>
    </div>,
    document.body,
  );
}
