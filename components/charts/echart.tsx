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

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: "canvas",
    });
    chartRef.current = chart;
    chart.setOption(option, setOptionOpts);

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

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }
    chartRef.current.setOption(option, setOptionOpts);
  }, [option, setOptionOpts]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onClick) {
      return;
    }

    const handler = (params: unknown) => {
      if (typeof params === "object" && params !== null) {
        onClick(params as Record<string, unknown>);
      }
    };

    chart.on("click", handler);
    return () => {
      chart.off("click", handler);
    };
  }, [onClick]);

  return (
    <div
      ref={containerRef}
      className={["chart-frame", className].filter(Boolean).join(" ")}
      style={{ height }}
    />
  );
}
