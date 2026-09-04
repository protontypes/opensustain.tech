"use client";

import { useMemo, useState } from "react";

import type { EChartsOption } from "echarts";

import {
  buildTooltip,
  tooltipChrome,
} from "@/lib/charts/tooltip";
import { formatNumber } from "@/lib/format";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";
import type { KeywordCountRecord } from "@/lib/types";

import { useChartExport } from "@/lib/charts/use-chart-export";

import { EChart } from "./echart";
import { ExportMenu } from "./export-menu";
import { TopNField } from "./top-n-field";

export function KeywordCountsChart({
  records,
  defaultTopN = 30,
}: {
  records: KeywordCountRecord[];
  defaultTopN?: number;
}) {
  const [topN, setTopN] = useState(defaultTopN);
  const tokens = useChartTokens();

  // A fixed grid gutter is wider than the whole chart box on a phone.
  const [width, setWidth] = useState(0);
  const gutter =
    width > 0 ? Math.max(72, Math.min(180, width * 0.34)) : 180;

  const { chartRef, onExport } = useChartExport(
    "keyword-counts",
    () => ({
      columns: ["keyword", "mentions"],
      rows: records
        .slice(0, topN)
        .map((record) => [record.keyword, record.count]),
    }),
    [`top-${topN}`],
  );

  const option: EChartsOption = useMemo(() => {
    const top = records.slice(0, topN).reverse();
    return {
      animationDuration: 400,
      grid: { left: gutter + 16, right: Math.min(72, gutter * 0.4), top: 12, bottom: 32 },
      tooltip: {
        ...tooltipChrome(tokens),
        formatter: (params: unknown) => {
          const point = params as { name?: string; value?: unknown };
          return buildTooltip(tokens, {
            title: point.name ?? "",
            rows: [
              {
                label: "Mentions",
                value: formatNumber(Number(point.value ?? 0)),
                strong: true,
              },
            ],
          });
        },
      },
      xAxis: {
        type: "value",
        axisLabel: { color: tokens.muted },
        splitLine: { lineStyle: { color: tokens.grid } },
      },
      yAxis: {
        type: "category",
        data: top.map((record) => record.keyword),
        axisLabel: { color: tokens.ink },
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 14,
          itemStyle: { color: tokens.primary, borderRadius: [0, 8, 8, 0] },
          data: top.map((record) => record.count),
          label: {
            show: true,
            position: "right",
            color: tokens.ink,
            formatter: (params: { value?: unknown }) =>
              formatNumber(Number(params.value ?? 0)),
          },
        },
      ],
    };
  }, [records, topN, tokens, gutter]);

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          {/* Its own list stopped at 120 of 300 keywords with no way to see
              the rest, and repeated the selected-value bug TopNField fixes. */}
          <TopNField
            value={topN}
            onChange={setTopN}
            max={records.length}
            noun="keywords"
          />
          <ExportMenu onExport={onExport} />
        </div>
      </div>
      <EChart
        instanceRef={chartRef}
          onWidth={setWidth}
        label={`Bar chart: the ${Math.min(topN, records.length)} most mentioned keywords`}
        option={option}
        height={Math.max(360, topN * 24 + 60)}
      />
    </div>
  );
}
