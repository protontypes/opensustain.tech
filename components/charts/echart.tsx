"use client";

import { useEffect, useRef } from "react";

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

/** Replace rather than merge, so removed series and filtered data disappear. */
const DEFAULT_SET_OPTION: SetOptionOpts = { notMerge: true, lazyUpdate: true };

type EChartProps = {
  option: EChartsOption;
  className?: string;
  height?: number;
  onClick?: (params: Record<string, unknown>) => void;
  setOptionOpts?: SetOptionOpts;
};

export function EChart({
  option,
  className,
  height = 520,
  onClick,
  setOptionOpts,
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
