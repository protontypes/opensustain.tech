"use client";

import { useMemo } from "react";

import type { EChartsOption } from "echarts";

import { formatNumber } from "@/lib/format";
import type { KeywordCountRecord } from "@/lib/types";

import { EChart } from "./echart";

export function KeywordCountsChart({
  records,
  topN = 30,
}: {
  records: KeywordCountRecord[];
  topN?: number;
}) {
  const option: EChartsOption = useMemo(() => {
    const top = records.slice(0, topN).reverse();

    return {
      grid: {
        left: 180,
        right: 24,
        top: 16,
        bottom: 24,
      },
      tooltip: {
        backgroundColor: "rgba(16, 22, 32, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#e2e8f0" },
        formatter: (params: any) =>
          `<strong>${params.name ?? ""}</strong><br/>Count: ${formatNumber(
            Number(params.value ?? 0),
          )}`,
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
        data: top.map((record) => record.keyword),
      },
      series: [
        {
          type: "bar",
          barWidth: 18,
          data: top.map((record) => ({
            value: record.count,
            name: record.keyword,
            itemStyle: {
              color: "#2563eb",
              borderRadius: [0, 10, 10, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: ({ value }: any) => formatNumber(value),
            color: "#101620",
          },
        },
      ],
    };
  }, [records, topN]);

  return <EChart option={option} height={Math.max(520, topN * 28)} />;
}
