"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { EChartsOption, SetOptionOpts } from "echarts";
import * as echarts from "echarts/core";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { BarChart, HeatmapChart, ScatterChart, SunburstChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  BarChart,
  HeatmapChart,
  ScatterChart,
  SunburstChart,
  CanvasRenderer,
]);

/**
 * Registers a GeoJSON map under `name`, once per page load.
 *
 * ECharts ships no map data and `registerMap` is global, so this is here rather
 * than in a chart component that may mount more than once. The map *chart* is
 * deliberately not registered here: `echarts.use` in this module puts the code
 * in every route that draws any chart, and pulling MapChart in cost /projects
 * and /topics 18 KB for a chart neither of them has. organizations-map.tsx
 * registers it, so it lands only in the route that needs it.
 */
export function registerMap(name: string, geoJson: unknown): void {
  if (echarts.getMap(name)) return;
  echarts.registerMap(name, geoJson as Parameters<typeof echarts.registerMap>[1]);
}

/** Replace rather than merge, so removed series and filtered data disappear. */
const DEFAULT_SET_OPTION: SetOptionOpts = { notMerge: true, lazyUpdate: true };

export type EChartHandle = echarts.EChartsType;

type EChartProps = {
  option: EChartsOption;
  className?: string;
  height?: number;
  onClick?: (params: Record<string, unknown>) => void;
  setOptionOpts?: SetOptionOpts;
  /** Filled with the live instance, so the caller can export the canvas. */
  instanceRef?: RefObject<EChartHandle | null>;
};

export function EChart({
  option,
  className,
  height = 520,
  onClick,
  setOptionOpts,
  instanceRef,
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  // Held in a ref so a parent's inline arrow does not churn the subscription
  // on every render, and so the cleanup can never run against a disposed chart.
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: "canvas",
    });
    chartRef.current = chart;
    if (instanceRef) instanceRef.current = chart;

    const handler = (params: unknown) => {
      if (typeof params === "object" && params !== null) {
        onClickRef.current?.(params as Record<string, unknown>);
      }
    };
    chart.on("click", handler);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
      if (instanceRef) instanceRef.current = null;
    };
  }, []);

  // The single owner of setOption. The init effect deliberately does not call
  // it: doing both built every chart twice, the second time with a stale
  // closure over `option` from the empty-dependency init effect.
  useEffect(() => {
    chartRef.current?.setOption(option, setOptionOpts ?? DEFAULT_SET_OPTION);
  }, [option, setOptionOpts]);

  return (
    <div
      ref={containerRef}
      className={["chart-frame", className].filter(Boolean).join(" ")}
      style={{ height }}
    />
  );
}
