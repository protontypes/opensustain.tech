"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useElementSize } from "@/lib/hooks/use-element-size";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useTheme } from "@/lib/hooks/use-theme";
import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { formatNumber } from "@/lib/format";
import type { RankingMetricId } from "@/lib/types";
import { categoryColor, computeBins, fillFor } from "@/lib/sunburst/color";
import { holeRadius, layoutAll, type LaidOutNode } from "@/lib/sunburst/geometry";
import {
  applyFilters,
  ancestors,
  buildTree,
  flatten,
  matchesQuery,
} from "@/lib/sunburst/tree";
import { downloadBlob, toCsvBlob, toPngBlob, toSvgBlob } from "@/lib/sunburst/export";
import {
  INITIAL_VIEW,
  metricValue,
  type ActivityFilter,
  type EcosystemSunburstPayload,
  type SunburstNode,
  type ViewState,
} from "@/lib/sunburst/types";

import { SunburstSvg, type SunburstSvgHandle } from "./sunburst-svg";
import { SunburstToolbar } from "./sunburst-toolbar";
import { SunburstTooltip } from "./sunburst-tooltip";
import {
  SunburstColorBar,
  SunburstDetails,
  SunburstLegend,
} from "./sunburst-rail";

const MAX_CHART = 1040;

export function EcosystemSunburst() {
  const [payload, setPayload] = useState<EcosystemSunburstPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>(INITIAL_VIEW);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hover, setHover] = useState<{
    node: SunburstNode | null;
    x: number;
    y: number;
  }>({ node: null, x: 0, y: 0 });

  const svgHandle = useRef<SunburstSvgHandle | null>(null);
  const { ref: frameRef, width } = useElementSize<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const theme = useTheme();

  /**
   * Fetched on the client rather than passed down from the server component.
   * The payload is ~2.9 MB; as a prop it was JSON-escaped into the RSC Flight
   * stream and inlined into the HTML on every navigation (the home document was
   * 5.05 MB). Fetched from /data it is a normal cacheable static asset.
   */
  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("ecosystemSunburst"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<EcosystemSunburstPayload>;
      })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unknown error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tree = useMemo(
    () => (payload ? buildTree(payload) : null),
    [payload],
  );

  const totals = useMemo(
    () =>
      tree
        ? { all: tree.totalLeaves, active: tree.activeLeaves }
        : { all: 0, active: 0 },
    [tree],
  );

  /** Re-apportions arc angles. Search deliberately does not filter — it dims. */
  const filtered = useMemo(() => {
    if (!tree) return null;
    applyFilters(tree, { activity: view.activity, isolated: view.isolated });
    return tree;
  }, [tree, view.activity, view.isolated]);

  const focusNode = useMemo(() => {
    if (!filtered) return null;
    let node = filtered;
    for (const id of view.zoomPath) {
      const next = node.children.find((child) => child.id === id);
      if (!next) break;
      node = next;
    }
    return node;
  }, [filtered, view.zoomPath]);

  /** Stable, tree-order list. Never changes identity, so path refs survive zooms. */
  const allNodes = useMemo(
    () => (tree ? flatten(tree).filter((node) => node.kind !== "root") : []),
    [tree],
  );

  const laid: LaidOutNode[] = useMemo(() => {
    if (!focusNode || allNodes.length === 0) return [];
    return layoutAll(allNodes, focusNode);
  }, [allNodes, focusNode, view.activity, view.isolated]);

  const bins = useMemo(() => {
    if (!filtered) return computeBins([]);
    const values: (number | null)[] = [];
    for (const node of flatten(filtered)) {
      if (node.kind === "project" && node.visibleLeaves > 0) {
        values.push(metricValue(node, view.metric));
      }
    }
    return computeBins(values);
    // activity/isolated participate explicitly: applyFilters mutates the tree in
    // place, so `filtered` keeps its identity and would not invalidate this.
  }, [filtered, view.metric, view.activity, view.isolated]);

  const categoryColors = payload?.category_colors ?? {};

  const fills = useMemo(
    () =>
      laid.map((item) =>
        fillFor(item.node, item.ring, view.metric, bins, categoryColors),
      ),
    // `theme` participates so the memo re-runs on a theme swap; the CSS custom
    // properties resolve differently even though the token names do not change.
    [laid, view.metric, bins, categoryColors, theme],
  );

  const matches = useMemo(() => {
    const needle = view.query.trim().toLowerCase();
    if (needle.length < 2) return null;
    const set = new Set<string>();
    for (const item of laid) {
      if (matchesQuery(item.node, needle)) {
        for (const ancestor of ancestors(item.node)) set.add(ancestor.id);
      }
    }
    return set;
  }, [laid, view.query]);

  const matchCount = useMemo(() => {
    if (!matches) return 0;
    return laid.filter(
      (item) =>
        item.visible &&
        item.node.kind === "project" &&
        matches.has(item.node.id),
    ).length;
  }, [matches, laid]);

  const trail = useMemo(
    () => (focusNode ? ancestors(focusNode) : []),
    [focusNode],
  );

  const selectedNode = useMemo(() => {
    if (!view.selectedId) return null;
    return (
      laid.find((item) => item.visible && item.node.id === view.selectedId)
        ?.node ?? null
    );
  }, [laid, view.selectedId]);

  const update = useCallback((patch: Partial<ViewState>) => {
    setView((current) => {
      // Idempotent: a patch that changes nothing must not produce a new state
      // object, or any effect keyed on view state re-fires forever.
      let changed = false;
      for (const key of Object.keys(patch) as (keyof ViewState)[]) {
        if (!Object.is(current[key], patch[key])) {
          changed = true;
          break;
        }
      }
      return changed ? { ...current, ...patch } : current;
    });
  }, []);

  /* Every handler passed to a child is stable. Inline arrows here gave the
     toolbar a fresh onQuery on each render, which restarted its debounce
     effect on every pass — a permanent ~180ms re-render loop over 2,785 arcs. */
  const handleMetric = useCallback(
    (metric: RankingMetricId) => update({ metric }),
    [update],
  );
  const handleActivity = useCallback(
    (activity: ActivityFilter) => update({ activity }),
    [update],
  );
  const handleQuery = useCallback(
    (query: string) => update({ query }),
    [update],
  );
  const handleHover = useCallback(
    (node: SunburstNode | null, x: number, y: number) =>
      setHover({ node, x, y }),
    [],
  );

  const handleActivate = useCallback(
    (node: SunburstNode, openRepo: boolean) => {
      // Any activation dismisses the tooltip: it is anchored to the last
      // pointer position and would otherwise sit over the details panel.
      setHover({ node: null, x: 0, y: 0 });
      if (node.kind === "project") {
        const url = node.project?.url;
        if (openRepo && url) {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
        update({ selectedId: node.id });
        return;
      }
      update({
        zoomPath: ancestors(node)
          .slice(1)
          .map((item) => item.id),
        selectedId: null,
      });
      setFocusedIndex(-1);
    },
    [update],
  );

  const zoomOut = useCallback(() => {
    setHover({ node: null, x: 0, y: 0 });
    setView((current) => ({
      ...current,
      zoomPath: current.zoomPath.slice(0, -1),
      selectedId: null,
    }));
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape in a search field is the browser's "clear the box" gesture —
      // stealing it would also drop the selection or pop a zoom level.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (view.selectedId) update({ selectedId: null });
      else if (view.zoomPath.length > 0) zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.selectedId, view.zoomPath.length, update, zoomOut]);

  // The tooltip is position:fixed at the last pointer position, so a scroll
  // leaves it stranded over unrelated content.
  useEffect(() => {
    const dismiss = () => setHover((current) =>
      current.node ? { node: null, x: 0, y: 0 } : current,
    );
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => window.removeEventListener("scroll", dismiss);
  }, []);

  // A filter or zoom can remove the selected project; without this the app still
  // believes something is selected — Reset stays lit and Escape is swallowed.
  useEffect(() => {
    if (view.selectedId && !selectedNode) update({ selectedId: null });
  }, [view.selectedId, selectedNode, update]);

  const handleZoomTo = useCallback(
    (index: number) =>
      update({
        zoomPath: trail.slice(1, index + 1).map((item) => item.id),
        selectedId: null,
      }),
    [update, trail],
  );

  const handleReset = useCallback(() => {
    setView(INITIAL_VIEW);
    setFocusedIndex(-1);
  }, []);

  const handleExport = useCallback(
    async (kind: "png" | "svg" | "csv") => {
      const svg = svgHandle.current?.svg();
      const stamp = focusNode?.name.replace(/\W+/g, "-").toLowerCase() ?? "ecosystem";
      if (kind === "csv") {
        const leaves = laid
          .filter((item) => item.visible && item.node.kind === "project")
          .map((item) => item.node);
        downloadBlob(
          toCsvBlob(leaves, payload!.metric_labels),
          `opensustain-${stamp}.csv`,
        );
        return;
      }
      if (!svg) return;
      if (kind === "svg") {
        downloadBlob(toSvgBlob(svg), `opensustain-${stamp}.svg`);
        return;
      }
      downloadBlob(await toPngBlob(svg), `opensustain-${stamp}.png`);
    },
    [laid, payload, focusNode],
  );

  const size = Math.max(280, Math.min(width || MAX_CHART, MAX_CHART));
  const canReset =
    view.zoomPath.length > 0 ||
    view.isolated.length > 0 ||
    view.query !== "" ||
    view.selectedId !== null ||
    view.activity !== INITIAL_VIEW.activity ||
    view.metric !== INITIAL_VIEW.metric;

  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>The ecosystem data could not be loaded ({error}).</p>
        <button
          type="button"
          className="viz-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!payload || !focusNode) {
    return (
      <div className="viz-state" aria-busy="true" aria-live="polite">
        <div className="viz-skeleton" style={{ height: MAX_CHART }}>
          <span className="viz-skeleton__ring viz-skeleton__ring--1" />
          <span className="viz-skeleton__ring viz-skeleton__ring--2" />
          <span className="viz-skeleton__ring viz-skeleton__ring--3" />
        </div>
        <p className="viz-state__label">Loading the ecosystem…</p>
      </div>
    );
  }

  const hole = focusNode.kind === "root" ? null : focusNode;

  return (
    <div className="viz-root">
      <SunburstToolbar
        trail={trail}
        metric={view.metric}
        metricLabels={payload.metric_labels}
        activity={view.activity}
        totals={totals}
        query={view.query}
        canReset={canReset}
        categoryColors={categoryColors}
        onMetric={handleMetric}
        onActivity={handleActivity}
        onQuery={handleQuery}
        onZoomTo={handleZoomTo}
        onReset={handleReset}
        onExport={handleExport}
      />

      <div className="viz-body" ref={frameRef}>
        <div className="viz-chart">
          <div className="viz-chart__stage" style={{ height: size }}>
            <SunburstSvg
              laid={laid}
              size={size}
              zoomDepth={focusNode.depth}
              fills={fills}
              centreFill={
                focusNode.kind === "root"
                  ? "var(--viz-centre-root)"
                  : categoryColor(focusNode.category, categoryColors)
              }
              matches={matches}
              selectedId={view.selectedId}
              focusedIndex={focusedIndex}
              reducedMotion={reducedMotion}
              handleRef={svgHandle}
              onHover={handleHover}
              onActivate={handleActivate}
              onFocusIndex={setFocusedIndex}
            />

            <div
              className={
                focusNode.kind === "root" ? "viz-hole" : "viz-hole viz-hole--filled"
              }
              // holeRadius is a fraction of the OUTER radius (size / 2), so the
              // overlay's diameter is size * holeRadius — not twice that, which
              // would spill over the category ring and swallow its clicks.
              style={{
                width: size * holeRadius(focusNode.depth),
                height: size * holeRadius(focusNode.depth),
              }}
            >
              {hole ? (
                <button
                  type="button"
                  className="viz-hole__button"
                  onClick={zoomOut}
                >
                  <span className="viz-hole__eyebrow">
                    {hole.kind === "category" ? "Category" : hole.category}
                  </span>
                  <span className="viz-hole__title">{hole.name}</span>
                  <span className="viz-hole__meta">
                    {formatNumber(hole.visibleLeaves)} projects
                  </span>
                  <span className="viz-hole__back">Back</span>
                </button>
              ) : (
                <a
                  className="viz-hole__button"
                  href="https://opensustain.tech/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="viz-hole__eyebrow">OpenSustain.tech</span>
                  <span className="viz-hole__title">
                    The Open Source Ecosystem in Sustainability
                  </span>
                  <span className="viz-hole__meta">
                    {formatNumber(focusNode.visibleLeaves)} projects ·{" "}
                    {formatNumber(focusNode.children.length)} categories
                  </span>
                  <span className="viz-hole__hint">
                    Click a category to see its projects
                  </span>
                </a>
              )}
            </div>
          </div>

          {matches ? (
            <p className="viz-chart__note" role="status">
              {matchCount > 0
                ? `${formatNumber(matchCount)} projects match “${view.query}”.`
                : `Nothing matches “${view.query}”. Try a shorter term.`}
            </p>
          ) : null}
        </div>

      </div>

      {selectedNode ? (
        <SunburstDetails
          node={selectedNode}
          metricLabels={payload.metric_labels}
          onClear={() => update({ selectedId: null })}
        />
      ) : null}

      <div className="viz-footer">
        <SunburstColorBar
          metric={view.metric}
          metricLabels={payload.metric_labels}
          bins={bins}
          hue={
            focusNode.kind === "root"
              ? "var(--color-primary)"
              : categoryColor(focusNode.category, categoryColors)
          }
          hueLabel={focusNode.kind === "root" ? null : focusNode.category}
        />
        <SunburstLegend
          categories={filtered?.children ?? []}
          isolated={view.isolated}
          categoryColors={categoryColors}
          onToggle={(name) =>
            setView((current) => ({
              ...current,
              isolated: current.isolated.includes(name)
                ? current.isolated.filter((item) => item !== name)
                : [...current.isolated, name],
              zoomPath: [],
              selectedId: null,
            }))
          }
          onClear={() => update({ isolated: [] })}
        />
      </div>

      <SunburstTooltip
        node={hover.node}
        x={hover.x}
        y={hover.y}
        metric={view.metric}
        metricLabels={payload.metric_labels}
      />
    </div>
  );
}
