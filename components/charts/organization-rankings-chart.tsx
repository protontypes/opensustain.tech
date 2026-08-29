"use client";

import { useMemo } from "react";

import type { EChartsOption } from "echarts";

import { formatDecimal } from "@/lib/format";
import type { OrganizationRankingRecord } from "@/lib/types";

import { EChart } from "./echart";

export function OrganizationRankingsChart({
  records,
  topN = 25,
}: {
  records: OrganizationRankingRecord[];
  topN?: number;
}) {
  const option: EChartsOption = useMemo(() => {
    const top = records.slice(0, topN).reverse();

    return {
      grid: {
        left: 240,
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
            `<strong>${data.organization_name}</strong>`,
            `Total score: ${formatDecimal(data.total_score, 2)}`,
            `Matched projects: ${data.matched_project_count}`,
            data.form_of_organization
              ? `Type: ${data.form_of_organization}`
              : "",
            data.location_country ? `Country: ${data.location_country}` : "",
            data.organization_description || "",
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
        data: top.map((record) => record.organization_name),
        axisLabel: {
          width: 200,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          barWidth: 18,
          data: top.map((record) => ({
            ...record,
            value: record.total_score,
            itemStyle: {
              color: "#10b981",
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
  }, [records, topN]);

  return (
    <EChart
      option={option}
      height={Math.max(520, topN * 28)}
      onClick={(params) => {
        const data = params.data as { organization_url?: string } | undefined;
        if (data?.organization_url) {
          window.open(data.organization_url, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}
