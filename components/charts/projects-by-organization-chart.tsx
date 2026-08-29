"use client";

import { useMemo } from "react";

import type { EChartsOption } from "echarts";

import type { ProjectsByOrganizationPayload } from "@/lib/types";

import { EChart } from "./echart";

export function ProjectsByOrganizationChart({
  payload,
  topN = 80,
}: {
  payload: ProjectsByOrganizationPayload;
  topN?: number;
}) {
  const option: EChartsOption = useMemo(() => {
    const children = payload.root.children.slice(0, topN);

    return {
      tooltip: {
        confine: true,
        formatter: (params: any) => {
          const data = params.data;
          if (!data) {
            return `<strong>${params.name ?? "Node"}</strong>`;
          }

          if ("total_score_combined" in data) {
            return [
              `<strong>${params.name ?? "Project"}</strong>`,
              `Category: ${String(data.category ?? "")}`,
              `Sub-category: ${String(data.sub_category ?? "")}`,
              `Total score: ${Number(data.total_score_combined ?? 0).toFixed(2)}`,
            ]
              .filter(Boolean)
              .join("<br/>");
          }

          return [
            `<strong>${params.name ?? "Organization"}</strong>`,
            `Projects: ${Number(data.value ?? 0).toLocaleString("en-US")}`,
            `Total score: ${Number(data.total_score ?? 0).toFixed(2)}`,
          ].join("<br/>");
        },
      },
      series: [
        {
          type: "sunburst",
          radius: ["18%", "96%"],
          sort: undefined,
          data: children,
          emphasis: {
            focus: "ancestor",
          },
          label: {
            rotate: "radial",
            overflow: "truncate",
            minAngle: 3,
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.28)",
          },
        },
      ],
    };
  }, [payload, topN]);

  return (
    <EChart
      option={option}
      height={720}
      onClick={(params) => {
        const data = params.data as { url?: string } | undefined;
        if (data?.url) {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}
