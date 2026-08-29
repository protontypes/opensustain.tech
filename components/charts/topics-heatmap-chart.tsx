"use client";

import { useMemo } from "react";

import type { EChartsOption } from "echarts";

import type { TopicsHeatmapPayload } from "@/lib/types";

import { EChart } from "./echart";

export function TopicsHeatmapChart({
  payload,
  topN = 120,
}: {
  payload: TopicsHeatmapPayload;
  topN?: number;
}) {
  const option: EChartsOption = useMemo(() => {
    const topicCount = Math.min(topN, payload.topics.length);
    const topics = payload.topics.slice(0, topicCount);
    const matrix = payload.matrix.map((row) => row.slice(0, topicCount));
    const logMatrix = payload.log10_matrix.map((row) => row.slice(0, topicCount));
    const values = logMatrix.flat();

    return {
      grid: {
        left: 220,
        right: 54,
        top: 24,
        bottom: 190,
      },
      tooltip: {
        confine: true,
        formatter: (params: any) => {
          const data = params.data;
          if (!data) {
            return "";
          }
          const [xIndex, yIndex] = data;
          return [
            `<strong>${topics[xIndex] ?? ""}</strong>`,
            `Sub-category: ${payload.sub_categories[yIndex] ?? ""}`,
            `Count: ${matrix[yIndex]?.[xIndex] ?? 0}`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: topics,
        axisLabel: {
          rotate: 45,
          width: 120,
          overflow: "truncate",
        },
      },
      yAxis: {
        type: "category",
        data: payload.sub_categories,
        axisLabel: {
          width: 190,
          overflow: "truncate",
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(...values, 1),
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 32,
        inRange: {
          color: ["#fafcfd", "#47f6ad", "#2563eb", "#101620"],
        },
      },
      series: [
        {
          type: "heatmap",
          data: logMatrix.flatMap((row, yIndex) =>
            row.map((value, xIndex) => [xIndex, yIndex, value]),
          ),
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(16, 22, 32, 0.10)",
            },
          },
        },
      ],
    };
  }, [payload, topN]);

  return (
    <EChart
      option={option}
      height={Math.max(920, payload.sub_categories.length * 16 + 320)}
    />
  );
}
