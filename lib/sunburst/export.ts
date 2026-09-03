import type { ProjectMetrics, RankingMetricId } from "@/lib/types";

import { METRIC_ORDER, type SunburstNode } from "./types";

/**
 * Serialises the live SVG with every `var(--…)` resolved to a literal colour,
 * so the downloaded file renders standalone instead of falling back to black.
 */
function inlineComputedStyles(source: SVGSVGElement): SVGSVGElement {
  const clone = source.cloneNode(true) as SVGSVGElement;
  const sourceNodes = [source, ...Array.from(source.querySelectorAll("*"))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];

  const properties = [
    "fill",
    "stroke",
    "stroke-width",
    "opacity",
    "fill-opacity",
    "stroke-opacity",
    "font-family",
    "font-size",
    "font-weight",
    "letter-spacing",
    "paint-order",
  ];

  sourceNodes.forEach((node, index) => {
    if (!(node instanceof Element)) return;
    const target = cloneNodes[index];
    if (!(target instanceof Element)) return;
    const computed = window.getComputedStyle(node);
    for (const property of properties) {
      const value = computed.getPropertyValue(property);
      if (value && value !== "none" && value !== "normal") {
        (target as SVGElement).style.setProperty(property, value);
      }
    }
  });

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const background = window.getComputedStyle(source).getPropertyValue(
    "--viz-arc-stroke",
  );
  if (background) {
    const rect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    // The viewBox origin is (-outerRadius, -outerRadius), so a rect at (0,0)
    // would only cover the bottom-right quadrant. Read the real origin off the
    // source rather than assuming it.
    const box = source.viewBox?.baseVal;
    rect.setAttribute("x", String(box ? box.x : 0));
    rect.setAttribute("y", String(box ? box.y : 0));
    rect.setAttribute("width", box ? String(box.width) : "100%");
    rect.setAttribute("height", box ? String(box.height) : "100%");
    rect.setAttribute("fill", background.trim());
    clone.insertBefore(rect, clone.firstChild);
  }
  return clone;
}

export function toSvgBlob(source: SVGSVGElement): Blob {
  const markup = new XMLSerializer().serializeToString(
    inlineComputedStyles(source),
  );
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${markup}`], {
    type: "image/svg+xml;charset=utf-8",
  });
}

export async function toPngBlob(
  source: SVGSVGElement,
  scale = 2,
): Promise<Blob> {
  const svgBlob = toSvgBlob(source);
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not rasterise the chart."));
      image.src = url;
    });
    const box = source.getBoundingClientRect();
    const width = Math.round((box.width || 1000) * scale);
    const height = Math.round((box.height || 1000) * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Could not encode the PNG.")),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function csvCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsvBlob(
  leaves: SunburstNode[],
  metricLabels: Record<RankingMetricId, string>,
): Blob {
  const header = [
    "name",
    "category",
    "sub_category",
    "url",
    "homepage",
    "is_active_last_365d",
    "latest_commit_activity",
    ...METRIC_ORDER.map((metric) => metricLabels[metric] ?? metric),
  ];

  const rows = leaves.map((leaf) => {
    const project = leaf.project!;
    const metrics = project.metrics as ProjectMetrics;
    return [
      project.name,
      project.category,
      project.sub_category,
      project.url,
      project.homepage,
      project.is_active_last_365d,
      project.latest_commit_activity ?? "",
      ...METRIC_ORDER.map((metric) => metrics[metric] ?? ""),
    ]
      .map(csvCell)
      .join(",");
  });

  return new Blob([[header.map(csvCell).join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
