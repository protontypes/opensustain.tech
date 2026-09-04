"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";

import {
  arcPath,
  arcWidthPx,
  bandsFor,
  buildHitIndex,
  hitTest,
  holeRadius,
  labelFor,
  strokeWidthFor,
  type LaidOutNode,
} from "@/lib/sunburst/geometry";
import { startTween } from "@/lib/sunburst/tween";
import type { Rect, SunburstNode } from "@/lib/sunburst/types";

const ZOOM_DURATION = 750;

export type SunburstSvgHandle = {
  svg: () => SVGSVGElement | null;
};

type Props = {
  laid: LaidOutNode[];
  size: number;
  zoomDepth: number;
  fills: string[];
  /** Fill for the centre plate — the focused node's own colour. */
  centreFill: string;
  /** Ids of nodes matching the search; empty means "no active search". */
  matches: Set<string> | null;
  selectedId: string | null;
  focusedIndex: number;
  /** All three sunbursts share this renderer, so each names itself. */
  label: string;
  /**
   * True where a plain click selects a leaf rather than opening it. Only the
   * ecosystem chart has a selection panel.
   */
  selectsOnClick?: boolean;
  reducedMotion: boolean;
  handleRef: RefObject<SunburstSvgHandle | null>;
  onHover: (node: SunburstNode | null, x: number, y: number) => void;
  onActivate: (node: SunburstNode, openRepo: boolean) => void;
  onFocusIndex: (index: number) => void;
};

export function SunburstSvg({
  laid,
  size,
  zoomDepth,
  fills,
  centreFill,
  matches,
  selectedId,
  focusedIndex,
  label,
  selectsOnClick = false,
  reducedMotion,
  handleRef,
  onHover,
  onActivate,
  onFocusIndex,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const previousRects = useRef<Rect[] | null>(null);
  /** The rects the tween last actually painted, so an interrupted zoom resumes from screen. */
  const liveRects = useRef<Rect[] | null>(null);
  const labelGroup = useRef<SVGGElement | null>(null);
  /** Bumped whenever the layout changes, to invalidate clicks that straddle a zoom. */
  const generation = useRef(0);
  const tweenRef = useRef<{ cancel: () => void } | null>(null);
  const hoverIndex = useRef(-1);

  const outerRadius = size / 2;

  useImperativeHandle(handleRef, () => ({ svg: () => svgRef.current }), []);

  /** focusedIndex of -1 means "not yet placed" — land on the first visible arc. */
  const firstVisible = useMemo(
    () => laid.findIndex((item) => item.visible),
    [laid],
  );
  const activeIndex =
    focusedIndex >= 0 && focusedIndex < laid.length && laid[focusedIndex]?.visible
      ? focusedIndex
      : firstVisible;

  const hitIndex = useMemo(() => {
    // Ring count comes from what was actually laid out, so the hit bands always
    // match the drawn bands whatever the tree's shape.
    const rings = laid.reduce(
      (max, item) => (item.visible ? Math.max(max, item.ring) : max),
      0,
    );
    return buildHitIndex(laid, bandsFor(zoomDepth, rings));
  }, [laid, zoomDepth]);

  const paths = useMemo(
    () => laid.map((item) => arcPath(item.rect, outerRadius)),
    [laid, outerRadius],
  );

  const strokes = useMemo(
    () => laid.map((item) => strokeWidthFor(item.rect, item.ring, outerRadius)),
    [laid, outerRadius],
  );

  const setPathRef = useCallback(
    (index: number) => (element: SVGPathElement | null) => {
      pathRefs.current[index] = element;
    },
    [],
  );

  const labels = useMemo(
    () =>
      laid
        .map((item, index) => ({ index, label: labelFor(item, outerRadius) }))
        .filter((entry) => entry.label !== null),
    [laid, outerRadius],
  );

  /**
   * Writes hover/search/isolation opacity straight onto the DOM. Routing this
   * through React state would reconcile every arc on each pointermove.
   */
  const paintEmphasis = useCallback(() => {
    const hovered = hoverIndex.current;
    // Defensive: the ref is an index into whatever `laid` was when the pointer
    // last moved, which may no longer be the array being painted.
    const hoveredNode = hovered >= 0 ? (laid[hovered]?.node ?? null) : null;
    const ancestry = new Set<string>();
    if (hoveredNode) {
      let cursor: SunburstNode | null = hoveredNode;
      while (cursor) {
        ancestry.add(cursor.id);
        cursor = cursor.parent;
      }
    }

    for (let i = 0; i < laid.length; i += 1) {
      const element = pathRefs.current[i];
      if (!element) continue;
      const node = laid[i].node;

      let opacity = 1;
      if (matches) {
        opacity = matches.has(node.id) ? 1 : 0.12;
      }
      if (hoveredNode) {
        opacity = ancestry.has(node.id) ? 1 : Math.min(opacity, 0.2);
      }

      element.style.opacity = opacity === 1 ? "" : String(opacity);
      const isSelected = node.id === selectedId;
      const isHovered = hoveredNode !== null && hovered === i;
      if (isSelected || isHovered) {
        element.setAttribute(
          "stroke",
          isSelected
            ? "var(--viz-select-stroke)"
            : "var(--viz-arc-stroke-emphasis)",
        );
        element.setAttribute("stroke-width", isSelected ? "2.5" : "2");
        element.style.paintOrder = "stroke";
      } else {
        element.setAttribute("stroke", "var(--viz-arc-stroke)");
        element.setAttribute("stroke-width", String(strokes[i]));
        element.style.paintOrder = "";
      }
    }
  }, [laid, matches, selectedId, strokes]);

  /** Zoom / filter transitions: interpolate rects, write `d` per frame. */
  useLayoutEffect(() => {
    // A zoom while a tween is mid-flight must continue from what is on screen,
    // not from the target the abandoned tween was heading for.
    const from = liveRects.current ?? previousRects.current;
    const targets = laid.map((item) => item.rect);
    const changed =
      from !== null &&
      from.length === targets.length &&
      from.some(
        (rect, i) =>
          rect.x0 !== targets[i].x0 ||
          rect.x1 !== targets[i].x1 ||
          rect.y0 !== targets[i].y0 ||
          rect.y1 !== targets[i].y1,
      );

    tweenRef.current?.cancel();
    // A stale hover index would otherwise dim the whole ring around whatever
    // arc happened to occupy that slot in the new layout.
    hoverIndex.current = -1;

    const write = (rects: Rect[], progress: number) => {
      for (let i = 0; i < rects.length; i += 1) {
        const element = pathRefs.current[i];
        if (!element) continue;
        // Sub-pixel arcs contribute nothing mid-flight; skipping them keeps the
        // frame budget sane when all 2,691 project arcs are on screen.
        if (progress < 1 && arcWidthPx(rects[i], outerRadius) < 0.75) continue;
        element.setAttribute("d", arcPath(rects[i], outerRadius));
      }
      liveRects.current = progress < 1 ? rects.map((r) => ({ ...r })) : null;
      if (labelGroup.current) {
        // Labels are positioned at the destination, so hide them until the arcs
        // arrive rather than letting them float over the wrong ring.
        labelGroup.current.style.opacity = progress < 1 ? "0" : "";
      }
    };

    if (changed) {
      tweenRef.current = startTween(
        from,
        targets,
        write,
        ZOOM_DURATION,
        reducedMotion,
      );
    } else {
      // Same layout (a resize, or a metric change that only recolours):
      // repaint once instead of running a 750ms no-op animation.
      write(targets, 1);
    }

    previousRects.current = targets;
    return () => {
      tweenRef.current?.cancel();
      // A cancelled tween must not leave the labels hidden; the next effect run
      // repositions them, and if there is no next run they belong on screen.
      if (labelGroup.current) labelGroup.current.style.opacity = "";
    };
  }, [laid, outerRadius, reducedMotion]);

  useEffect(() => {
    paintEmphasis();
  }, [paintEmphasis]);

  useEffect(() => {
    const element = pathRefs.current[activeIndex];
    if (element && document.activeElement !== element) {
      const svg = svgRef.current;
      if (svg && svg.contains(document.activeElement)) element.focus();
    }
  }, [activeIndex]);

  const resolve = useCallback(
    (event: React.PointerEvent | React.MouseEvent): number => {
      const svg = svgRef.current;
      if (!svg) return -1;
      const box = svg.getBoundingClientRect();
      const scale = box.width ? size / box.width : 1;
      const dx = (event.clientX - box.left - box.width / 2) * scale;
      const dy = (event.clientY - box.top - box.height / 2) * scale;
      return hitTest(hitIndex, dx, dy, outerRadius);
    },
    [hitIndex, outerRadius, size],
  );

  const handleMove = useCallback(
    (event: React.PointerEvent) => {
      const index = resolve(event);
      if (index === hoverIndex.current) {
        if (index >= 0) onHover(laid[index].node, event.clientX, event.clientY);
        return;
      }
      hoverIndex.current = index;
      paintEmphasis();
      onHover(
        index >= 0 ? laid[index].node : null,
        event.clientX,
        event.clientY,
      );
    },
    [resolve, laid, onHover, paintEmphasis],
  );

  const handleLeave = useCallback(() => {
    hoverIndex.current = -1;
    paintEmphasis();
    onHover(null, 0, 0);
  }, [onHover, paintEmphasis]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      const index = resolve(event);
      if (index < 0) return;
      onFocusIndex(index);
      onActivate(laid[index].node, event.metaKey || event.ctrlKey);
    },
    [resolve, laid, onActivate, onFocusIndex],
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const index = resolve(event);
      if (index < 0) return;
      const node = laid[index].node;
      // Only leaves open a repo. Without this, double-clicking a branch zoomed
      // on the first click and then opened whatever project had landed under
      // the cursor in the new layout.
      //
      // `selectsOnClick` is false in the two organisation charts, where a
      // single click already opens the repository — activating again here
      // opened it a second and third time for one double-click.
      if (selectsOnClick && node.kind === "project" && laid[index].visible) {
        onActivate(node, true);
      }
    },
    [resolve, laid, onActivate, selectsOnClick],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const current = laid[activeIndex];
      if (!current) return;
      const siblings = laid.filter(
        (item) => item.visible && item.node.parent === current.node.parent,
      );
      const position = siblings.indexOf(current);

      const focusNode = (target: LaidOutNode | undefined) => {
        if (!target) return;
        event.preventDefault();
        onFocusIndex(laid.indexOf(target));
      };

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          focusNode(siblings[(position + 1) % siblings.length]);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          focusNode(
            siblings[(position - 1 + siblings.length) % siblings.length],
          );
          break;
        case "]":
          focusNode(
            laid.find((item) => item.visible && item.node.parent === current.node),
          );
          break;
        case "[":
          focusNode(
            laid.find((item) => item.visible && item.node === current.node.parent),
          );
          break;
        case "Home":
          focusNode(siblings[0]);
          break;
        case "End":
          focusNode(siblings[siblings.length - 1]);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          onActivate(current.node, event.metaKey || event.ctrlKey);
          break;
        default:
          break;
      }
    },
    [laid, activeIndex, onActivate, onFocusIndex],
  );

  return (
    <svg
      ref={svgRef}
      className="viz-sunburst"
      width={size}
      height={size}
      viewBox={`${-outerRadius} ${-outerRadius} ${size} ${size}`}
      role="tree"
      aria-label={label}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* The centre plate. Filled, not a void — it is the focused node, and at
          depth it is the largest single element in the chart. */}
      <circle
        className="viz-centre-plate"
        r={holeRadius(zoomDepth) * outerRadius}
        fill={centreFill}
      />

      <g className="viz-arcs">
        {laid.map((item, index) => (
          <path
            key={item.node.id}
            ref={setPathRef(index)}
            className="viz-arc"
            d={paths[index]}
            fill={fills[index]}
            stroke="var(--viz-arc-stroke)"
            strokeWidth={strokes[index]}
            role={item.visible ? "treeitem" : "presentation"}
            aria-level={item.visible ? item.ring : undefined}
            aria-label={item.visible ? ariaLabelFor(item.node) : undefined}
            aria-selected={item.visible ? item.node.id === selectedId : undefined}
            aria-hidden={item.visible ? undefined : true}
            tabIndex={item.visible && index === activeIndex ? 0 : -1}
            onFocus={() => onFocusIndex(index)}
          />
        ))}
      </g>

      <g className="viz-labels" ref={labelGroup} aria-hidden="true">
        {labels.map(({ index, label }) => {
          if (!label) return null;
          const degrees = (label.angle * 180) / Math.PI - 90;
          const flip = label.angle > Math.PI;
          const lineHeight = label.fontSize * 1.16;
          const offset = -((label.lines.length - 1) * lineHeight) / 2;
          return (
            <text
              key={laid[index].node.id}
              className={`viz-label viz-label--${laid[index].node.kind}`}
              transform={`rotate(${degrees}) translate(${label.radius},0)${
                flip ? " rotate(180)" : ""
              }`}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={label.fontSize}
              fontWeight={label.weight}
            >
              {label.lines.map((line, lineIndex) => (
                <tspan key={line} x={0} y={offset + lineIndex * lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function ariaLabelFor(node: SunburstNode): string {
  if (node.kind === "project") {
    const project = node.project;
    if (project) {
      return `${node.name}, project in ${project.sub_category}, ${
        project.is_active_last_365d ? "active" : "no commits in the past year"
      }`;
    }
    // Organization tree: the ecosystem metrics are not present here.
    return node.detail?.subtitle
      ? `${node.name}, project, ${node.detail.subtitle}`
      : `${node.name}, project`;
  }
  const kind =
    node.kind === "category"
      ? "category"
      : node.kind === "organization"
        ? "organization"
        : "sub-category";
  const noun = node.detail?.leafNoun ?? "project";
  return `${node.name}, ${kind}, ${node.visibleLeaves} ${noun}${
    node.visibleLeaves === 1 ? "" : "s"
  }`;
}
