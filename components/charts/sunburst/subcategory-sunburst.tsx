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
import { formatNumber, pluralize } from "@/lib/format";
import { useElementSize } from "@/lib/hooks/use-element-size";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useTheme } from "@/lib/hooks/use-theme";
import type { OrganizationsBySubcategoryPayload } from "@/lib/types";
import { categoryColor } from "@/lib/sunburst/color";
import { holeFit, layoutAll, type LaidOutNode } from "@/lib/sunburst/geometry";
import {
  applySubcategoryFilters,
  buildSubcategoryTree,
} from "@/lib/sunburst/subcategory-tree";
import {
  downloadBlob,
  exportFilename,
  nodesToCsvBlob,
  toPngBlob,
  toSvgBlob,
} from "@/lib/sunburst/export";
import { ancestors, flatten, matchesQuery } from "@/lib/sunburst/tree";
import type { SunburstNode } from "@/lib/sunburst/types";

import { useOrganizationFilters } from "../organization-filters";
import { ExportMenu } from "../export-menu";
import { SunburstNodeTooltip } from "./sunburst-node-tooltip";
import { SunburstSearch } from "./sunburst-search";
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
const ROOT_HINT = "Click a sub-category to see its organizations";

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
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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

  const counts = useMemo(() => {
    if (!tree) {
      return { subcategories: 0, listings: 0, organizations: 0, hidden: 0 };
    }
    return applySubcategoryFilters(tree, (node) =>
      filters.matches(node.detail?.country, node.detail?.orgType),
    );
  }, [tree, filters]);

  const focusNode = useMemo(() => {
    if (!tree) return null;
    if (!zoomId) return tree;
    const found = tree.children.find((child) => child.id === zoomId);
    // A filter can empty the sub-category you were looking at; fall back to the
    // root rather than rendering a focus with nothing under it.
    return found && found.visibleLeaves > 0 ? found : tree;
  }, [tree, zoomId, counts]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return null;
    const set = new Set<string>();
    for (const node of allNodes) {
      if (matchesQuery(node, needle)) {
        for (const ancestor of ancestors(node)) set.add(ancestor.id);
      }
    }
    return set;
  }, [allNodes, query]);

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

  const handleExport = useCallback(
    async (format: "png" | "svg" | "csv") => {
      const name = exportFilename("organizations-by-subcategory", format, [
        filters.country,
        filters.type,
      ]);
      if (format === "csv") {
        // One row per listing on screen — the sub-category is what makes the
        // row, so an organization in three of them is three rows.
        const rows = (tree?.children ?? []).flatMap((sub) =>
          sub.children.filter((org) => org.visibleLeaves > 0),
        );
        downloadBlob(
          nodesToCsvBlob(
            rows,
            ["sub_category", "category", "organization", "country", "type", "url"],
            (org) => [
              org.parent?.name ?? "",
              org.category,
              org.name,
              org.detail?.country ?? "",
              org.detail?.orgType ?? "",
              org.detail?.url ?? "",
            ],
          ),
          name,
        );
        return;
      }
      const svg = svgHandle.current?.svg();
      if (!svg) return;
      downloadBlob(
        format === "svg" ? toSvgBlob(svg) : await toPngBlob(svg),
        name,
      );
    },
    [tree, filters],
  );

  const zoomOut = useCallback(() => {
    setHover({ node: null, x: 0, y: 0 });
    setZoomId(null);
    setFocusedIndex(-1);
  }, []);

  const matchCount = useMemo(
    () =>
      matches
        ? allNodes.filter(
            (node) => node.visibleLeaves > 0 && matches.has(node.id),
          ).length
        : 0,
    [matches, allNodes],
  );

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
  const filtered = filters.active;
  const trail = ancestors(focusNode);
  const empty = counts.listings === 0;
  const fit = holeFit(size, focusNode.depth);
  const holeStyle = {
    width: fit.diameter,
    height: fit.diameter,
    "--viz-hole-d": `${fit.diameter}px`,
  } as CSSProperties;
  const rootMeta = `${pluralize(
    counts.subcategories,
    "sub-category",
    "sub-categories",
  )} · ${pluralize(counts.organizations, "organization")}`;

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

  // Whatever the circle was too small to hold goes on the line beneath it.
  const caption = [
    fit.compact
      ? zoomed
        ? pluralize(focusNode.visibleLeaves, "organization")
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
                  {index === 0 ? "All sub-categories" : node.name}
                </button>
              </span>
            );
          })}
        </nav>

        <div className="viz-toolbar__controls">
          <SunburstSearch
            query={query}
            onQuery={setQuery}
            placeholder="Sub-category or organization name"
          />
          {/* Country and type live in the page filter bar, which drives every
              chart here; only the zoom is local to this one. */}
          <button
            type="button"
            className="viz-button"
            onClick={() => {
              setQuery("");
              zoomOut();
            }}
            disabled={!zoomed && !query}
          >
            Reset
          </button>
          <ExportMenu formats={["png", "svg", "csv"]} onExport={handleExport} />
        </div>
      </div>

      <div className="viz-body" ref={frameRef}>
        <div className="viz-chart">
          {empty ? (
            <div className="viz-state" role="status">
              <p className="viz-state__label">
                No organizations match the current filters.
              </p>
            </div>
          ) : (
            <div className="viz-chart__stage" style={{ height: size }}>
              <SunburstSvg
                laid={laid}
                size={size}
                zoomDepth={focusNode.depth}
              label={"Sunburst: sub-categories, opening to the organizations working in each"}
                fills={fills}
                centreFill={
                  zoomed && focusNode.category
                    ? categoryColor(focusNode.category, categoryColors)
                    : "var(--viz-centre-root)"
                }
                matches={matches}
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
                      {fit.tiny
                        ? "Sub-Categories"
                        : "Organizations by Sub-Category"}
                    </span>
                    <span className="viz-hole__meta">{rootMeta}</span>
                    {/* The organization ring is not drawn until a sub-category
                        is opened, so the chart has to say so. */}
                    <span className="viz-hole__hint">{ROOT_HINT}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {caption ? <p className="viz-chart__caption">{caption}</p> : null}

          {matches ? (
            <p className="viz-chart__note" role="status">
              {matchCount > 0
                ? `${formatNumber(matchCount)} match “${query}”.`
                : `Nothing matches “${query}”. Try a shorter term.`}
            </p>
          ) : null}

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
