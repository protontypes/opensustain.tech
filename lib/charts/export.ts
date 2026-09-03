export type CsvValue = string | number | boolean | null | undefined;

function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A CSV of exactly the rows on screen, not the whole payload. */
export function toCsvBlob(columns: string[], rows: CsvValue[][]): Blob {
  const body = [columns, ...rows].map((row) => row.map(csvCell).join(","));
  return new Blob([body.join("\n")], { type: "text/csv;charset=utf-8" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * A filename that says what the file contains.
 *
 * A folder of `opensustain.csv` files is unidentifiable a week later, so the
 * view's own state — metric, category, top-N — rides along in the name.
 */
export function exportFilename(
  chart: string,
  extension: string,
  parts: (string | number | null | undefined | false)[] = [],
): string {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  const tail = parts
    .filter((part): part is string | number => Boolean(part))
    .map((part) => slug(String(part)))
    .filter(Boolean);
  return [
    "opensustain",
    slug(chart),
    ...tail,
    stamp,
  ].join("-") + `.${extension}`;
}

/**
 * PNG from a live ECharts instance.
 *
 * `getDataURL` reads the canvas it already drew, so this costs nothing at
 * import time. SVG is deliberately not offered for these: it needs SVGRenderer
 * registered, which lands in every route that draws any chart, and a vector bar
 * chart is worth little next to the CSV.
 */
export function echartPngBlob(
  chart: { getDataURL: (options: Record<string, unknown>) => string },
  backgroundColor: string,
): Blob {
  const dataUrl = chart.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor,
  });
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}
