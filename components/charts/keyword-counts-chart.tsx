"use client";

import { useMemo, useState } from "react";

import type { EChartsOption } from "echarts";

import { buildTooltip } from "@/lib/charts/tooltip";
import { formatNumber } from "@/lib/format";
import { useChartTokens } from "@/lib/hooks/use-chart-tokens";
import type { KeywordCountRecord } from "@/lib/types";

import { useChartExport } from "@/lib/charts/use-chart-export";

import { EChart } from "./echart";
import { ExportMenu } from "./export-menu";

const TOP_N_CHOICES = [15, 30, 60, 120];

export function KeywordCountsChart({
  records,
  defaultTopN = 30,
}: {
  records: KeywordCountRecord[];
  defaultTopN?: number;
}) {
  const [topN, setTopN] = useState(defaultTopN);
  const tokens = useChartTokens();

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
      grid: { left: 180, right: 72, top: 12, bottom: 32 },
      tooltip: {
        confine: true,
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.tooltipBorder,
        borderWidth: 1,
        extraCssText:
          "box-shadow:0 14px 40px rgba(16,22,32,.14);border-radius:12px",
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
  }, [records, topN, tokens]);

  return (
    <div className="viz-root">
      <div className="viz-toolbar">
        <div className="viz-toolbar__controls">
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Show</span>
            <select
              value={topN}
              onChange={(event) => setTopN(Number(event.target.value))}
            >
              {TOP_N_CHOICES.filter((choice) => choice <= records.length).map(
                (choice) => (
                  <option key={choice} value={choice}>
                    Top {choice} keywords
                  </option>
                ),
              )}
            </select>
          </label>
          <ExportMenu onExport={onExport} />
        </div>
      </div>
      <EChart
        instanceRef={chartRef}
        option={option}
        height={Math.max(360, topN * 24 + 60)}
      />
    </div>
  );
}
