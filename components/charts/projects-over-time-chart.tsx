"use client";

import { useMemo } from "react";

import type { EChartsOption } from "echarts";

import type { ProjectsOverTimeRecord } from "@/lib/types";

import { EChart } from "./echart";

function symbolSize(value: number) {
  return Math.max(7, Math.min(28, Math.sqrt(Math.max(value, 0)) * 1.8 + 4));
}

export function ProjectsOverTimeChart({
  records,
  categoryColors,
  topCategories = 13,
}: {
  records: ProjectsOverTimeRecord[];
  categoryColors: Record<string, string>;
  topCategories?: number;
}) {
  const option: EChartsOption = useMemo(() => {
    const categories = Array.from(new Set(records.map((record) => record.category)))
      .filter(Boolean)
      .slice(0, topCategories);
    const subCategories = Array.from(
      new Set(records.map((record) => record.sub_category)),
    ).sort((left, right) => left.localeCompare(right));

    return {
      legend: {
        type: "scroll",
        top: 0,
      },
      grid: {
        left: 210,
        right: 24,
        top: 72,
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
            `<strong>${String(data.name ?? "")}</strong>`,
            `Category: ${String(data.category ?? "")}`,
            `Sub-category: ${String(data.sub_category ?? "")}`,
            `Age: ${Number(data.project_age_years ?? 0).toFixed(1)} years`,
            String(data.description ?? ""),
          ]
            .filter(Boolean)
            .join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        name: "Project age (years)",
        nameLocation: "middle",
        nameGap: 28,
        inverse: true,
        splitLine: {
          lineStyle: {
            color: "rgba(230, 237, 243, 0.95)",
          },
        },
      },
      yAxis: {
        type: "category",
        data: subCategories,
        axisLabel: {
          width: 180,
          overflow: "truncate",
        },
      },
      series: categories.map((category) => ({
        name: category,
        type: "scatter",
        data: records
          .filter((record) => record.category === category)
          .map((record) => ({
            ...record,
            value: [record.project_age_years, record.sub_category],
            symbolSize: symbolSize(record.size_metrics.contributors),
            itemStyle: {
              color: categoryColors[category] ?? "#2563eb",
              opacity: 0.85,
            },
          })),
      })),
    };
  }, [categoryColors, records, topCategories]);

  return (
    <EChart
      option={option}
      height={Math.max(760, 18 * new Set(records.map((record) => record.sub_category)).size + 280)}
      onClick={(params) => {
        const data = params.data as { url?: string } | undefined;
        if (data?.url) {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}
