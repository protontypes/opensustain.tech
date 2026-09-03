import { arc as d3arc } from "d3-shape";

import type { Rect, SunburstNode } from "./types";

const TAU = Math.PI * 2;

/**
 * Ring radii as a fraction of the outer radius, keyed by how many levels are
 * zoomed in. Rings collapse as you descend so the remaining ones get the space:
 * at level 2 a single sub-category's projects own the whole disc, which is what
 * makes the 101-character project names fit radially.
 *
 * The 0.96 ceiling reserves a halo for the selected-arc stroke and focus ring.
 */
const CEILING = 0.96;

export type RingBand = { y0: number; y1: number };

/**
 * The hole grows as you descend, matching the Plotly reference: at the root it
 * is a modest centre, and by the time a single sub-category owns the disc the
 * middle is a large filled plate carrying that node's name. Fewer rings need the
 * radius, and the deeper you are the more the centre has to say.
 */
export const HOLE_RADII: Record<number, number> = {
  0: 0.24,
  1: 0.34,
  2: 0.44,
};

/**
 * Rings drawn below the focused node, by zoom depth.
 *
 * Two rings at the root, not three — the same depth window as `maxdepth=3` in
 * tabs/ecosystem_tab.py:224. Individual projects appear once you open a
 * category. Drawing all 2,691 of them at the top level gave each 0.13° of arc:
 * a pale halo that carries no readable information, crowds the two rings that
 * do, and costs 1,667 arcs of rasterisation for nothing.
 */
const RING_GAP = 0.005;
/** The outermost ring carries the longest names, so it gets a little more depth. */
const RING_WEIGHTS: Record<number, number[]> = {
  1: [1],
  2: [1, 1.15],
};

/**
 * Rings drawn below the focus, at most.
 *
 * Two, matching `maxdepth=3` in tabs/ecosystem_tab.py:224 — the focus plus two
 * rings. Deeper levels appear when you zoom into them.
 */
export const MAX_RINGS = 2;

/** How many levels of descendants a node actually has, capped. */
export function subtreeHeight(node: SunburstNode, cap = MAX_RINGS): number {
  if (cap === 0 || node.children.length === 0) return 0;
  let best = 0;
  for (const child of node.children) {
    best = Math.max(best, 1 + subtreeHeight(child, cap - 1));
    if (best >= cap) return cap;
  }
  return best;
}

/**
 * Ring bands for a focus, derived from how deep its subtree actually goes.
 *
 * Keying these off the zoom depth alone assumed every tree is the ecosystem's
 * three levels. The organization chart has two, so at depth 1 it drew its only
 * ring in the inner band and left the outer third of the radius blank.
 */
export function bandsFor(zoomDepth: number, ringCount: number): RingBand[] {
  const count = Math.max(1, Math.min(ringCount, 2));
  const hole = holeRadius(zoomDepth);
  const start = hole + RING_GAP;
  const span = CEILING - start;
  const weights = RING_WEIGHTS[count];
  const total = weights.reduce((sum, w) => sum + w, 0);

  const bands: RingBand[] = [];
  let cursor = start;
  for (const weight of weights) {
    const height = (span * weight) / total;
    bands.push({ y0: cursor, y1: cursor + height - RING_GAP });
    cursor += height;
  }
  return bands;
}

/**
 * @param maxRings how many rings this chart chooses to reveal at once. The
 * ecosystem shows two (categories + sub-categories); the organization chart
 * shows one, so its project ring only appears once an organization is opened.
 */
export function bandsForFocus(
  focus: SunburstNode,
  maxRings: number = MAX_RINGS,
): RingBand[] {
  // min(what the data has, what we choose to show)
  return bandsFor(focus.depth, Math.min(subtreeHeight(focus, maxRings), maxRings));
}

export function holeRadius(zoomDepth: number): number {
  return HOLE_RADII[Math.min(zoomDepth, 2)];
}

export type LaidOutNode = {
  node: SunburstNode;
  rect: Rect;
  /** Depth relative to the focused node: 1 = innermost drawn ring. */
  ring: number;
  /** False for nodes collapsed out of the current depth window. */
  visible: boolean;
};

/**
 * Assigns a rect to EVERY node in the tree for the given focus.
 *
 * Nodes outside the visible depth window are not dropped — they are collapsed:
 * ancestors and unrelated branches to a point at the hole, deeper descendants to
 * a sliver at the rim, each keeping the angle it will have when it does appear.
 * That is what makes the zoom animate. The previous version emitted only the
 * visible nodes, so the array identity changed completely on every zoom and the
 * tween could never find a matching "from" state — it snapped instead.
 *
 * The returned array is aligned index-for-index with `allNodes`, so the caller's
 * path refs stay stable across zooms and the tween can write straight to them.
 */
export function layoutAll(
  allNodes: SunburstNode[],
  focus: SunburstNode,
  maxRings: number = MAX_RINGS,
): LaidOutNode[] {
  const bands = bandsForFocus(focus, maxRings);
  const rimY = bands[bands.length - 1].y1;
  const hole = holeRadius(focus.depth);

  const angles = new Map<string, [number, number]>();
  const total = focus.visibleLeaves;

  if (total > 0) {
    // Angles are assigned to the whole subtree, not just the visible rings, so a
    // project keeps its bearing while it waits collapsed at the rim.
    const assign = (node: SunburstNode, x0: number, x1: number) => {
      angles.set(node.id, [x0, x1]);
      const span = x1 - x0;
      let cursor = x0;
      for (const child of node.children) {
        if (child.visibleLeaves <= 0) continue;
        const width = (child.visibleLeaves / node.visibleLeaves) * span;
        assign(child, cursor, cursor + width);
        cursor += width;
      }
    };
    let cursor = 0;
    for (const child of focus.children) {
      if (child.visibleLeaves <= 0) continue;
      const width = (child.visibleLeaves / total) * TAU;
      assign(child, cursor, cursor + width);
      cursor += width;
    }
  }

  return allNodes.map((node) => {
    const ring = node.depth - focus.depth;
    const angle = angles.get(node.id);

    if (!angle) {
      // Not under the focus (an ancestor, or a sibling branch): collapse into
      // the hole so it shrinks away on zoom in and blooms out on zoom out.
      return {
        node,
        ring,
        visible: false,
        rect: { x0: 0, x1: 0, y0: hole, y1: hole },
      };
    }

    const [x0, x1] = angle;
    if (ring > bands.length) {
      // Deeper than the window: park it at the rim, keeping its angle.
      return { node, ring, visible: false, rect: { x0, x1, y0: rimY, y1: rimY } };
    }

    const band = bands[ring - 1];
    return {
      node,
      ring,
      visible: true,
      rect: { x0, x1, y0: band.y0, y1: band.y1 },
    };
  });
}

/** Arc thickness in device px at the mid-radius — the predicate everything gates on. */
export function arcWidthPx(rect: Rect, outerRadius: number): number {
  const midRadius = ((rect.y0 + rect.y1) / 2) * outerRadius;
  return (rect.x1 - rect.x0) * midRadius;
}

const arcGenerator = d3arc<Rect>()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .innerRadius((d) => d.y0)
  .outerRadius((d) => d.y1);

/**
 * Builds the path for one arc.
 *
 * Padding and corner rounding are applied only where the arc is wide enough to
 * survive them. The Plotly reference hard-codes a 2px black stroke
 * (tabs/ecosystem_tab.py:277); at 0.134° a project arc is 0.84px wide, so that
 * stroke swallows the arc and the outer ring renders as a black band. Gating on
 * measured width is what stops the same thing happening here.
 */
export function arcPath(rect: Rect, outerRadius: number): string {
  // Collapsed nodes (parked at the hole or the rim) have no area. Emitting an
  // empty path keeps ~2,700 invisible arcs out of the browser's paint work
  // instead of handing it real arc geometry that renders nothing.
  if (rect.y1 <= rect.y0 || rect.x1 <= rect.x0) return "";
  const width = arcWidthPx(rect, outerRadius);
  const midRadius = ((rect.y0 + rect.y1) / 2) * outerRadius;
  const pad = width >= 4 ? Math.min(0.004, 2 / Math.max(midRadius, 1)) : 0;
  const corner = width >= 6 ? 2 : 0;
  const scaled: Rect = {
    x0: rect.x0,
    x1: rect.x1,
    y0: rect.y0 * outerRadius,
    y1: rect.y1 * outerRadius,
  };
  return (
    arcGenerator.padAngle(pad).padRadius(outerRadius).cornerRadius(corner)(
      scaled,
    ) ?? ""
  );
}

/** Stroke widths from the design tokens, suppressed on sub-4px arcs. */
export function strokeWidthFor(
  rect: Rect,
  ring: number,
  outerRadius: number,
): number {
  if (arcWidthPx(rect, outerRadius) < 4) return 0;
  if (ring === 1) return 2;
  if (ring === 2) return 1.5;
  return 0.75;
}

/* ---------------------------------------------------------------- hit test */

export type HitIndex = {
  /** Per-ring arrays of {start, end, index} sorted by angle. */
  rings: Map<number, { starts: number[]; ends: number[]; indices: number[] }>;
  bands: RingBand[];
};

export function buildHitIndex(
  laid: LaidOutNode[],
  bands: RingBand[],
): HitIndex {
  const rings = new Map<
    number,
    { starts: number[]; ends: number[]; indices: number[] }
  >();
  laid.forEach((item, index) => {
    // Collapsed nodes carry no hit region, but the index it maps to is still
    // the node's position in the full array.
    if (!item.visible || item.rect.x1 <= item.rect.x0) return;
    let bucket = rings.get(item.ring);
    if (!bucket) {
      bucket = { starts: [], ends: [], indices: [] };
      rings.set(item.ring, bucket);
    }
    bucket.starts.push(item.rect.x0);
    bucket.ends.push(item.rect.x1);
    bucket.indices.push(index);
  });
  return { rings, bands };
}

/**
 * Resolves a pointer position to an arc index, or -1.
 *
 * Arcs carry `pointer-events: none` and a single transparent overlay receives
 * the events, so a 0.84px arc is still reliably hoverable — there are no
 * sub-pixel gaps between DOM hit regions to fall through.
 */
export function hitTest(
  index: HitIndex,
  dx: number,
  dy: number,
  outerRadius: number,
): number {
  const radius = Math.hypot(dx, dy) / outerRadius;
  let ring = -1;
  for (let i = 0; i < index.bands.length; i += 1) {
    const band = index.bands[i];
    // Include the inter-ring gap so the pointer never falls between rings.
    const lower = i === 0 ? band.y0 - 0.005 : band.y0 - 0.0025;
    const upper = i === index.bands.length - 1 ? 1 : band.y1 + 0.0025;
    if (radius >= lower && radius <= upper) {
      ring = i + 1;
      break;
    }
  }
  if (ring === -1) return -1;

  const bucket = index.rings.get(ring);
  if (!bucket) return -1;

  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += TAU;
  if (angle >= TAU) angle -= TAU;

  // Binary search over start angles: arcs are contiguous and sorted.
  let low = 0;
  let high = bucket.starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (angle < bucket.starts[mid]) high = mid - 1;
    else if (angle >= bucket.ends[mid]) low = mid + 1;
    else return bucket.indices[mid];
  }
  return -1;
}

/* ------------------------------------------------------------------ labels */

/** Average advance width per character as a fraction of font size. */
const ADVANCE = 0.58;
const ADVANCE_UPPER = 0.64;

export type ArcLabel = {
  lines: string[];
  fontSize: number;
  weight: number;
  /** Degrees; the text is rotated to run along the radius. */
  rotation: number;
  radius: number;
  angle: number;
  upper: boolean;
};

function wrap(text: string, maxChars: number): string[] | null {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  if (words.length < 2) return null;
  // Greedy two-line split at the balance point.
  let best: [string, string] | null = null;
  let bestDelta = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    if (first.length > maxChars || second.length > maxChars) continue;
    const delta = Math.abs(first.length - second.length);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = [first, second];
    }
  }
  return best;
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  if (maxChars < 2) return "";
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

/**
 * Decides whether and how one arc is labelled.
 *
 * Ring 1 runs a four-step cascade (two lines at 11px, two at 10px, one line
 * truncated, nothing) so that every category — including Energy Storage at
 * 6.69°, which ECharts hid outright with `label.minAngle: 8` — keeps its name.
 */
export function labelFor(
  item: LaidOutNode,
  outerRadius: number,
): ArcLabel | null {
  const { rect, ring, node } = item;
  if (!item.visible) return null;
  const width = arcWidthPx(rect, outerRadius);
  const depth = (rect.y1 - rect.y0) * outerRadius;
  const midRadius = ((rect.y0 + rect.y1) / 2) * outerRadius;
  const angle = (rect.x0 + rect.x1) / 2;

  // Radial text: rotate to the arc's bearing, flipping on the left half so no
  // label is ever upside down.
  const degrees = (angle * 180) / Math.PI - 90;
  const flipped = angle > Math.PI;
  const rotation = flipped ? degrees + 180 : degrees;

  // Keyed on what the node IS, not which ring it happens to occupy: at
  // sub-category focus the project ring is ring 1, and "pvlib-python" must not
  // render as "PVLIB-PYTHON".
  const isCategory = node.kind === "category";
  const base = {
    rotation,
    radius: midRadius,
    angle,
    upper: isCategory,
  };

  // Keyed on what the node IS, not which ring it lands in. A sub-category is
  // ring 2 at the root and ring 1 once its category is opened; keying on the
  // ring gave it two different treatments for the same content.
  if (isCategory) {
    const name = node.name.toUpperCase();
    const budget = (size: number) =>
      Math.floor((depth - 8) / (size * ADVANCE_UPPER));

    if (width >= 28) {
      const lines = wrap(name, budget(11));
      if (lines) return { ...base, lines, fontSize: 11, weight: 700 };
    }
    if (width >= 24) {
      const lines = wrap(name, budget(10));
      if (lines) return { ...base, lines, fontSize: 10, weight: 700 };
    }
    if (width >= 20) {
      const lines = wrap(name, budget(9));
      if (lines) return { ...base, lines, fontSize: 9, weight: 700 };
    }
    if (width >= 12) {
      for (const size of [11, 10, 9]) {
        if (width < size + 5) continue;
        if (name.length <= budget(size)) {
          return { ...base, lines: [name], fontSize: size, weight: 700 };
        }
      }
      const size = width >= 18 ? 10 : 9;
      return {
        ...base,
        lines: [truncate(name, budget(size))],
        fontSize: size,
        weight: 700,
      };
    }
    return null;
  }

  // Organizations occupy ring 1 of their own chart and read like sub-categories:
  // proper nouns, often long, so sentence case with the same wrap cascade.
  if (node.kind === "sub_category" || node.kind === "organization") {
    if (width < 14) return null;
    const budget = (size: number) => Math.floor((depth - 10) / (size * ADVANCE));
    // Names like "Atmospheric Chemistry and Aerosol" only fit on two lines.
    if (width >= 26 && node.name.length > budget(11)) {
      const lines = wrap(node.name, budget(11));
      if (lines) return { ...base, lines, fontSize: 11, weight: 600 };
    }
    if (width >= 22 && node.name.length > budget(10)) {
      const lines = wrap(node.name, budget(10));
      if (lines) return { ...base, lines, fontSize: 10, weight: 600 };
    }
    for (const size of [11, 10, 9]) {
      if (node.name.length <= budget(size)) {
        return { ...base, lines: [node.name], fontSize: size, weight: 600 };
      }
    }
    return {
      ...base,
      lines: [truncate(node.name, budget(10))],
      fontSize: 10,
      weight: 600,
    };
  }

  if (width < 9) return null;
  const fontSize = width >= 11 ? 10 : 9;
  const maxChars = Math.floor((depth - 10) / (fontSize * ADVANCE));
  if (maxChars < 3) return null;
  return {
    ...base,
    lines: [truncate(node.name, maxChars)],
    fontSize,
    weight: 500,
  };
}
