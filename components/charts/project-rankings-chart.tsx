"use client";

import { useMemo } from "react";

import type { EChartsOption } from "echarts";

import { formatCompactNumber, formatDecimal } from "@/lib/format";
import type {
  ProjectRankingRecord,
  RankingMetricId,
} from "@/lib/types";

import { EChart } from "./echart";

export function ProjectRankingsChart({
  records,
  metric = "total_score_combined",
  topN = 25,
}: {
  records: ProjectRankingRecord[];
  metric?: RankingMetricId;
  topN?: number;
}) {
  const option: EChartsOption = useMemo(() => {
    const top = records.slice(0, topN).reverse();

    return {
      animationDuration: 450,
      grid: {
        left: 220,
        right: 36,
        top: 16,
        bottom: 24,
      },
      tooltip: {
        confine: true,
        backgroundColor: "rgba(16, 22, 32, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#e2e8f0" },
        formatter: (params: any) => {
          const data = params.data;
          if (!data) {
            return "";
          }

          return [
            `<strong>${data.name}</strong>`,
            `${metric}: ${formatDecimal(data.value, 2)}`,
            `Stars: ${formatCompactNumber(data.stars)}`,
            `Contributors: ${formatCompactNumber(data.contributors)}`,
            data.category ? `Category: ${data.category}` : "",
            data.description || "",
          ]
            .filter(Boolean)
            .join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        splitLine: {
          lineStyle: {
            color: "rgba(230, 237, 243, 0.95)",
          },
        },
      },
      yAxis: {
        type: "category",
        data: top.map((record) => record.name),
        axisLabel: {
          width: 180,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          barWidth: 18,
          data: top.map((record) => ({
            ...record,
            value: record[metric],
            itemStyle: {
              color: "#2563eb",
              borderRadius: [0, 10, 10, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: ({ value }: any) => formatDecimal(value, 2),
            color: "#101620",
          },
        },
      ],
    };
  }, [metric, records, topN]);

  return (
    <EChart
      option={option}
      height={Math.max(520, topN * 28)}
      onClick={(params) => {
        const data = params.data as { url?: string } | undefined;
        if (data?.url) {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}
