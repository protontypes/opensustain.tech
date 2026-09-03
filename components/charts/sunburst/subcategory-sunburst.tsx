"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { analyticsPayloadUrl } from "@/lib/data/contracts";
import { pluralize } from "@/lib/format";
import { useElementSize } from "@/lib/hooks/use-element-size";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useTheme } from "@/lib/hooks/use-theme";
import type { OrganizationsBySubcategoryPayload } from "@/lib/types";
import { categoryColor } from "@/lib/sunburst/color";
import { holeRadius, layoutAll, type LaidOutNode } from "@/lib/sunburst/geometry";
import {
  applySubcategoryFilters,
  buildSubcategoryTree,
  facetOptions,
} from "@/lib/sunburst/subcategory-tree";
import { ancestors, flatten } from "@/lib/sunburst/tree";
import type { SunburstNode } from "@/lib/sunburst/types";

import { SunburstNodeTooltip } from "./sunburst-node-tooltip";
import { SunburstSvg, type SunburstSvgHandle } from "./sunburst-svg";

const MAX_CHART = 1040;
/**
 * One ring at a time: the 81 sub-categories, then the organizations working in
 * whichever one is opened. Drawing both at once gives each of the 1,640
 * organization wedges 0.22° — the same failure the ecosystem chart's project
 * ring had. It also matches the reference's `maxdepth=2`
 * (tabs/organisations_by_subcategory_tab.py:60).
 */
const SUBCATEGORY_MAX_RINGS = 1;

export function SubcategorySunburst({
  categoryColors,
  subCategoriesByCategory,
}: {
  categoryColors: Record<string, string>;
  subCategoriesByCategory: Record<string, string[]>;
}) {
  const [payload, setPayload] =
    useState<OrganizationsBySubcategoryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [orgType, setOrgType] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    fetch(analyticsPayloadUrl("organizationsBySubcategory"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<OrganizationsBySubcategoryPayload>;
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
    () =>
      payload ? buildSubcategoryTree(payload, subCategoriesByCategory) : null,
    [payload, subCategoriesByCategory],
  );

  const allNodes = useMemo(
    () => (tree ? flatten(tree).filter((node) => node.kind !== "root") : []),
    [tree],
  );

  const facets = useMemo(
    () => (tree ? facetOptions(tree) : { countries: [], types: [] }),
    [tree],
  );

  const counts = useMemo(() => {
    if (!tree) {
      return { subcategories: 0, listings: 0, organizations: 0, hidden: 0 };
    }
    return applySubcategoryFilters(
      tree,
      country ? [country] : [],
      orgType ? [orgType] : [],
    );
  }, [tree, country, orgType]);

  const focusNode = useMemo(() => {
    if (!tree) return null;
    if (!zoomId) return tree;
    const found = tree.children.find((child) => child.id === zoomId);
    // A filter can empty the sub-category you were looking at; fall back to the
    // root rather than rendering a focus with nothing under it.
    return found && found.visibleLeaves > 0 ? found : tree;
  }, [tree, zoomId, counts]);

  const laid: LaidOutNode[] = useMemo(() => {
    if (!focusNode || allNodes.length === 0) return [];
    return layoutAll(allNodes, focusNode, SUBCATEGORY_MAX_RINGS);
  }, [allNodes, focusNode, counts]);

  const fills = useMemo(
    () =>
      laid.map((item) =>
        item.node.category
          ? categoryColor(item.node.category, categoryColors)
          : "var(--viz-null)",
      ),
    [laid, categoryColors, theme],
  );

  const handleActivate = useCallback((node: SunburstNode, openRepo: boolean) => {
    setHover({ node: null, x: 0, y: 0 });
    const url = node.detail?.url;
    if (node.kind === "organization") {
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (openRepo && url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setZoomId((current) => (current === node.id ? null : node.id));
    setFocusedIndex(-1);
  }, []);

  const zoomOut = useCallback(() => {
    setHover({ node: null, x: 0, y: 0 });
    setZoomId(null);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    const dismiss = () =>
      setHover((current) =>
        current.node ? { node: null, x: 0, y: 0 } : current,
      );
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
        <p>Sub-category data could not be loaded ({error}).</p>
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
        <p className="viz-state__label">Loading sub-categories…</p>
      </div>
    );
  }

  const zoomed = focusNode.kind !== "root";
  const filtered = Boolean(country || orgType);
  const trail = ancestors(focusNode);
  const empty = counts.listings === 0;

  // An organization listed under three sub-categories is three wedges, so the
  // wedge count and the organization count differ and the chart has to say why.
  const note = [
    counts.listings !== counts.organizations
      ? `${pluralize(counts.listings, "listing")} — an organization working across several sub-categories appears in each.`
      : null,
    filtered && counts.hidden > 0
      ? `${pluralize(counts.hidden, "listing")} hidden by the current filters.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

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
                  {index === 0 ? "All sub-categories" : node.name}
                </button>
              </span>
            );
          })}
        </nav>

        <div className="viz-toolbar__controls">
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              <option value="">All countries</option>
              {facets.countries.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </label>
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Type</span>
            <select
              value={orgType}
              onChange={(event) => setOrgType(event.target.value)}
            >
              <option value="">All types</option>
              {facets.types.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="viz-button"
            onClick={() => {
              setCountry("");
              setOrgType("");
              zoomOut();
            }}
            disabled={!zoomed && !filtered}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="viz-body" ref={frameRef}>
        <div className="viz-chart">
          {empty ? (
            <div className="viz-state" role="status">
              <p className="viz-state__label">
                No organizations match this country and type.
              </p>
            </div>
          ) : (
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
                className={zoomed ? "viz-hole viz-hole--filled" : "viz-hole"}
                style={{
                  width: size * holeRadius(focusNode.depth),
                  height: size * holeRadius(focusNode.depth),
                }}
              >
                {zoomed ? (
                  <button
                    type="button"
                    className="viz-hole__button"
                    onClick={zoomOut}
                  >
                    <span className="viz-hole__eyebrow">
                      {focusNode.category || "Sub-category"}
                    </span>
                    <span className="viz-hole__title">{focusNode.name}</span>
                    <span className="viz-hole__meta">
                      {pluralize(focusNode.visibleLeaves, "organization")}
                    </span>
                    <span className="viz-hole__back">Back</span>
                  </button>
                ) : (
                  <div className="viz-hole__button">
                    <span className="viz-hole__eyebrow">Where they work</span>
                    <span className="viz-hole__title">
                      Organizations by Sub-Category
                    </span>
                    <span className="viz-hole__meta">
                      {pluralize(counts.subcategories, "sub-category", "sub-categories")}{" "}
                      · {pluralize(counts.organizations, "organization")}
                    </span>
                    {/* The organization ring is not drawn until a sub-category
                        is opened, so the chart has to say so. */}
                    <span className="viz-hole__hint">
                      Click a sub-category to see its organizations
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {note ? (
            <p className="viz-chart__note" role="status">
              {note}
            </p>
          ) : null}
        </div>
      </div>

      <SunburstNodeTooltip node={hover.node} x={hover.x} y={hover.y} />
    </div>
  );
}
