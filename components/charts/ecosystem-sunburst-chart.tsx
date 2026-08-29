"use client";

import { useMemo } from "react";

import type {
  EcosystemCategoryNode,
  EcosystemProjectNode,
  EcosystemSubCategoryNode,
  EcosystemSunburstPayload,
} from "@/lib/types";

import { EChart } from "./echart";

function mapProjectNode(node: EcosystemProjectNode) {
  return {
    name: node.name,
    value: 1,
    url: node.url,
    description: node.description,
    category: node.category,
    subCategory: node.sub_category,
    metrics: node.metrics,
  };
}

function mapSubCategoryNode(node: EcosystemSubCategoryNode) {
  return {
    name: node.name,
    children: node.children.map(mapProjectNode),
  };
}

function mapCategoryNode(node: EcosystemCategoryNode) {
  return {
    name: node.name,
    itemStyle: {
      color: node.color,
    },
    children: node.children.map(mapSubCategoryNode),
  };
}

export function EcosystemSunburstChart({
  payload,
}: {
  payload: EcosystemSunburstPayload;
}) {
  const option = useMemo(
    () => ({
      // White background so the chart is always readable regardless of page theme,
      // matching the Plotly reference which uses plot_bgcolor="white"
      backgroundColor: "#ffffff",
      tooltip: {
        confine: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        textStyle: {
          color: "#1a2332",
          fontFamily: "Open Sans, Inter, sans-serif",
          fontSize: 13,
        },
        formatter: (params: {
          data?: {
            description?: string;
            category?: string;
            subCategory?: string;
            metrics?: Record<string, number>;
          };
          name?: string;
          treePathInfo?: Array<{ name?: string }>;
        }) => {
          const data = params.data;
          if (!data?.metrics) {
            return `<strong>${params.name ?? "Node"}</strong>`;
          }

          return [
            `<strong>${params.name ?? "Project"}</strong>`,
            data.category ? `Category: ${data.category}` : "",
            data.subCategory ? `Sub-category: ${data.subCategory}` : "",
            `Stars: ${data.metrics.stars.toLocaleString("en-US")}`,
            `Contributors: ${data.metrics.contributors.toLocaleString("en-US")}`,
            `Commits: ${data.metrics.total_commits.toLocaleString("en-US")}`,
            `Score: ${data.metrics.total_score_combined.toFixed(2)}`,
            data.description ?? "",
          ]
            .filter(Boolean)
            .join("<br/>");
        },
      },
      // Center title matching the Plotly reference
      graphic: [
        {
          type: "text",
          left: "center",
          top: "center",
          style: {
            text: "The Open Source Ecosystem\nin Sustainability",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "bold" as const,
            fontFamily: "Open Sans, Inter, sans-serif",
            fill: "#1a2332",
            lineHeight: 26,
          },
          z: 100,
        },
      ],
      // Smooth transition animation when clicking to zoom (like Plotly)
      animationDurationUpdate: 800,
      animationEasingUpdate: "cubicInOut" as const,
      series: [
        {
          type: "sunburst",
          data: payload.root.children.map(mapCategoryNode),
          radius: ["18%", "92%"],
          sort: undefined,
          emphasis: {
            focus: "ancestor",
          },
          // Click to zoom into a category/subcategory with smooth animation
          nodeClick: "zoomToNode",
          levels: [
            {},
            {
              // Category ring (innermost visible ring)
              r0: "18%",
              r: "38%",
              itemStyle: {
                borderWidth: 2,
                borderColor: "#ffffff",
              },
              label: {
                rotate: "radial",
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 19,
                color: "#1a2332",
                fontFamily: "Open Sans, Inter, sans-serif",
                minAngle: 8,
              },
            },
            {
              // Sub-category ring (middle ring)
              r0: "38%",
              r: "70%",
              itemStyle: {
                borderWidth: 2,
                borderColor: "#ffffff",
              },
              label: {
                rotate: "radial",
                fontSize: 12,
                lineHeight: 15,
                color: "#1a2332",
                fontFamily: "Open Sans, Inter, sans-serif",
                minAngle: 2,
              },
            },
            {
              // Project ring (outermost — thin color band, labels shown on zoom)
              r0: "70%",
              r: "92%",
              itemStyle: {
                borderWidth: 1,
                borderColor: "#ffffff",
              },
              label: {
                rotate: "radial",
                color: "#333333",
                fontSize: 9,
                lineHeight: 12,
                minAngle: 2,
                fontFamily: "Open Sans, Inter, sans-serif",
              },
            },
          ],
        },
      ],
    }),
    [payload],
  );

  return (
    <EChart
      option={option}
      height={900}
      className="sunburst-chart"
      onClick={(params) => {
        const data = params.data as { url?: string } | undefined;
        if (data?.url) {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}
