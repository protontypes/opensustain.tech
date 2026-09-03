"use client";

import { useCallback, useRef } from "react";

import type { EChartHandle } from "@/components/charts/echart";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";

import {
  downloadBlob,
  echartPngBlob,
  exportFilename,
  toCsvBlob,
  type CsvValue,
} from "./export";

export type CsvSource = () => { columns: string[]; rows: CsvValue[][] };

/**
 * Export wiring for a chart drawn with `EChart`.
 *
 * Returns the ref to hand to `<EChart instanceRef>` and the handler for
 * `<ExportMenu>`. PNG comes off the canvas the chart already drew; the CSV is
 * built from whatever the caller has on screen, so a top-25 view exports 25
 * rows and a filtered view exports what survived the filter.
 */
export function useChartExport(
  name: string,
  csv: CsvSource,
  parts: (string | number | null | undefined | false)[] = [],
) {
  const tokens = useChartTokens();
  const chartRef = useRef<EChartHandle | null>(null);

  // Held in a ref so the handler identity does not change with every render of
  // the caller's inline closure.
  const csvRef = useRef(csv);
  csvRef.current = csv;
  const partsRef = useRef(parts);
  partsRef.current = parts;

  const onExport = useCallback(
    (format: "png" | "svg" | "csv") => {
      const filename = exportFilename(name, format, partsRef.current);
      if (format === "csv") {
        const { columns, rows } = csvRef.current();
        downloadBlob(toCsvBlob(columns, rows), filename);
        return;
      }
      if (!chartRef.current) return;
      downloadBlob(echartPngBlob(chartRef.current, tokens.surface), filename);
    },
    [name, tokens.surface],
  );

  return { chartRef, onExport };
}
