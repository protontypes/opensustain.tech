"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { pluralize } from "@/lib/format";
import { useElementSize } from "@/lib/hooks/use-element-size";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useTheme } from "@/lib/hooks/use-theme";
import type {
  OrganizationsOverviewPayload,
  ProjectsByOrganizationPayload,
} from "@/lib/types";
import { categoryColor } from "@/lib/sunburst/color";
import { holeFit, layoutAll, type LaidOutNode } from "@/lib/sunburst/geometry";
import {
  buildOrganizationTree,
  limitOrganizations,
} from "@/lib/sunburst/org-tree";
import { ancestors, flatten } from "@/lib/sunburst/tree";
import type { SunburstNode } from "@/lib/sunburst/types";

import { useOrganizationFilters } from "../organization-filters";
import { SunburstNodeTooltip } from "./sunburst-node-tooltip";
import { SunburstSvg, type SunburstSvgHandle } from "./sunburst-svg";

const MAX_CHART = 1040;
/** One ring at a time: organizations, then that organization's projects. */
const ORG_MAX_RINGS = 1;
// Median org has 2 projects, so a high cap turns the ring into unlabelled
// slivers. 40 keeps every wedge nameable; the rest are one select away.
const TOP_N_CHOICES = [20, 40, 80, 150, 276];
const ROOT_HINT = "Click an organization to see its projects";

export function OrganizationSunburst({
  categoryColors,
}: {
  categoryColors: Record<string, string>;
}) {
  const [payload, setPayload] = useState<ProjectsByOrganizationPayload | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [topN, setTopN] = useState(40);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hover, setHover] = useState<{
    node: SunburstNode | null;
    x: number;
    y: number;
  }>({ node: null, x: 0, y: 0 });

  const svgHandle = useRef<SunburstSvgHandle | null>(null);
  const { ref: frameRef, width } = useElementSize<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const filters = useOrganizationFilters();
  // projects-by-organization carries no country or type, so the facets come
  // from the overview payload, joined on organization_url — all 276 of these
  // organizations join. The page already fetches it for its other charts.
  const { data: overview } =
    useAnalyticsPayload<OrganizationsOverviewPayload>("organizationsOverview");

  const facetsByUrl = useMemo(() => {
    const map = new Map<string, { country: string; type: string }>();
    for (const record of overview?.organizations_by_project_count ?? []) {
      if (!record.organization_url) continue;
      map.set(record.organization_url, {
        country: record.location_country,
        type: record.form_of_organization,
      });
    }
    return map;
  }, [overview]);

  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("projectsByOrganization"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<ProjectsByOrganizationPayload>;
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
    () => (payload ? buildOrganizationTree(payload) : null),
    [payload],
  );

  const allNodes = useMemo(
    () => (tree ? flatten(tree).filter((node) => node.kind !== "root") : []),
    [tree],
  );

  const limits = useMemo(() => {
    if (!tree) {
      return { shown: 0, hidden: 0, hiddenProjects: 0, matched: 0 };
    }
    const result = limitOrganizations(tree, topN, (org) => {
      if (!filters.active) return true;
      const facet = facetsByUrl.get(org.detail?.url ?? "");
      return filters.matches(facet?.country, facet?.type);
    });
    // Roll the leaf counts back up after filtering.
    for (const org of tree.children) {
      org.visibleLeaves = org.children.reduce(
        (sum, child) => sum + child.visibleLeaves,
        0,
      );
    }
    tree.visibleLeaves = tree.children.reduce(
      (sum, org) => sum + org.visibleLeaves,
      0,
    );
    return result;
  }, [tree, topN, filters, facetsByUrl]);

  const focusNode = useMemo(() => {
    if (!tree) return null;
    if (!zoomId) return tree;
    return tree.children.find((child) => child.id === zoomId) ?? tree;
  }, [tree, zoomId]);

  const laid: LaidOutNode[] = useMemo(() => {
    if (!focusNode || allNodes.length === 0) return [];
    return layoutAll(allNodes, focusNode, ORG_MAX_RINGS);
  }, [allNodes, focusNode, topN, limits]);

  const fills = useMemo(
    () =>
      laid.map((item) =>
        item.node.category
          ? categoryColor(item.node.category, categoryColors)
          : "var(--viz-null)",
      ),
    [laid, categoryColors, theme],
  );

  const handleActivate = useCallback(
    (node: SunburstNode, openRepo: boolean) => {
      setHover({ node: null, x: 0, y: 0 });
      const url = node.detail?.url;
      if (node.kind === "project") {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      if (openRepo && url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      setZoomId((current) => (current === node.id ? null : node.id));
      setFocusedIndex(-1);
    },
    [],
  );

  const zoomOut = useCallback(() => {
    setHover({ node: null, x: 0, y: 0 });
    setZoomId(null);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    const dismiss = () =>
      setHover((current) => (current.node ? { node: null, x: 0, y: 0 } : current));
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => window.removeEventListener("scroll", dismiss);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !zoomId) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.isContentEditable)) {
        return;
      }
      zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomId, zoomOut]);

  const size = Math.max(280, Math.min(width || MAX_CHART, MAX_CHART));

  if (error) {
    return (
      <div className="viz-state viz-state--error" role="alert">
        <p>Organization data could not be loaded ({error}).</p>
      </div>
    );
  }

  if (!payload || !focusNode) {
    return (
      <div className="viz-state" aria-busy="true" aria-live="polite">
        <div className="viz-skeleton" style={{ height: MAX_CHART }}>
          <span className="viz-skeleton__ring viz-skeleton__ring--2" />
          <span className="viz-skeleton__ring viz-skeleton__ring--3" />
        </div>
        <p className="viz-state__label">Loading organizations…</p>
      </div>
    );
  }

  const zoomed = focusNode.kind !== "root";
  const trail = ancestors(focusNode);
  const fit = holeFit(size, focusNode.depth);
  const holeStyle = {
    width: fit.diameter,
    height: fit.diameter,
    "--viz-hole-d": `${fit.diameter}px`,
  } as CSSProperties;
  const rootMeta = `${pluralize(limits.shown, "organization")} · ${pluralize(
    focusNode.visibleLeaves,
    "project",
  )}`;
  // Whatever the circle was too small to hold goes on the line beneath it.
  const caption = [
    fit.compact
      ? zoomed
        ? pluralize(focusNode.visibleLeaves, "project")
        : rootMeta
      : null,
    !fit.showHint && !zoomed ? ROOT_HINT : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <nav className="viz-breadcrumb" aria-label="Chart zoom level">
          {trail.map((node, index) => {
            const isLast = index === trail.length - 1;
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
                  onClick={zoomOut}
                >
                  {index === 0 ? "All organizations" : node.name}
                </button>
              </span>
            );
          })}
        </nav>

        <div className="viz-toolbar__controls">
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Show</span>
            <select
              value={topN}
              onChange={(event) => {
                setTopN(Number(event.target.value));
                setZoomId(null);
              }}
            >
              {TOP_N_CHOICES.map((choice) => (
                <option key={choice} value={choice}>
                  {choice >= (payload.root.children.length ?? 0)
                    ? `All ${payload.root.children.length} organizations`
                    : `Top ${choice} organizations`}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="viz-button"
            onClick={zoomOut}
            disabled={!zoomed}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="viz-body" ref={frameRef}>
        <div className="viz-chart">
          <div className="viz-chart__stage" style={{ height: size }}>
            <SunburstSvg
              laid={laid}
              size={size}
              zoomDepth={focusNode.depth}
              fills={fills}
              centreFill={
                zoomed && focusNode.category
                  ? categoryColor(focusNode.category, categoryColors)
                  : "var(--viz-centre-root)"
              }
              matches={null}
              selectedId={null}
              focusedIndex={focusedIndex}
              reducedMotion={reducedMotion}
              handleRef={svgHandle}
              onHover={(node, x, y) => setHover({ node, x, y })}
              onActivate={handleActivate}
              onFocusIndex={setFocusedIndex}
            />

            <div
              className={[
                "viz-hole",
                zoomed ? "viz-hole--filled" : null,
                fit.compact ? "viz-hole--compact" : null,
                fit.tiny ? "viz-hole--tiny" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              style={holeStyle}
            >
              {zoomed ? (
                <button
                  type="button"
                  className="viz-hole__button"
                  onClick={zoomOut}
                >
                  <span className="viz-hole__eyebrow">Organization</span>
                  <span className="viz-hole__title">{focusNode.name}</span>
                  <span className="viz-hole__meta">
                    {pluralize(focusNode.visibleLeaves, "project")}
                  </span>
                  <span className="viz-hole__back">Back</span>
                </button>
              ) : (
                <div className="viz-hole__button">
                  <span className="viz-hole__eyebrow">Who builds it</span>
                  <span className="viz-hole__title">
                    {fit.tiny ? "Organizations" : "Projects by Organization"}
                  </span>
                  <span className="viz-hole__meta">{rootMeta}</span>
                  {/* The project ring is not drawn until an organization is
                      opened, so the chart has to say so. */}
                  <span className="viz-hole__hint">{ROOT_HINT}</span>
                </div>
              )}
            </div>
          </div>

          {caption ? <p className="viz-chart__caption">{caption}</p> : null}

          {/* The old chart hard-coded a top-80 cut and said nothing about it. */}
          {limits.matched === 0 ? (
            <p className="viz-chart__note" role="status">
              No organizations match the current filters.
            </p>
          ) : limits.hidden > 0 ? (
            <p className="viz-chart__note" role="status">
              {pluralize(limits.hidden, "smaller organization")} (
              {pluralize(limits.hiddenProjects, "project")}) are not shown.
            </p>
          ) : null}
        </div>
      </div>

      <SunburstNodeTooltip node={hover.node} x={hover.x} y={hover.y} />
    </div>
  );
}
