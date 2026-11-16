"use client";

import { useEffect, useState } from "react";

import { useTheme } from "./use-theme";

/**
 * Resolved values of the design tokens the ECharts charts need.
 *
 * ECharts draws to canvas and cannot read CSS custom properties, so every
 * colour in those options was hardcoded — which meant axis labels, gridlines
 * and tooltips kept their light-theme values in dark mode. Reading the tokens
 * once per theme keeps the canvas charts on the same palette as everything else.
 */
export type ChartTokens = {
  ink: string;
  inkStrong: string;
  muted: string;
  grid: string;
  border: string;
  primary: string;
  surface: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipShadow: string;
  /** Fill for "no value" — the map's countries with no organizations. */
  nullFill: string;
  /** The brand green, for the one point or bar a chart calls out. Never data. */
  highlight: string;
};

const TOKEN_MAP: Record<keyof ChartTokens, string> = {
  ink: "--color-text",
  inkStrong: "--color-black",
  muted: "--color-text-secondary",
  grid: "--viz-grid-line",
  border: "--color-border",
  primary: "--color-primary",
  surface: "--color-card-bg",
  tooltipBg: "--viz-tooltip-bg",
  tooltipBorder: "--viz-tooltip-border",
  tooltipShadow: "--viz-tooltip-shadow",
  nullFill: "--viz-null",
  highlight: "--color-green",
};

const FALLBACK: ChartTokens = {
  ink: "#24211c",
  inkStrong: "#24211c",
  muted: "#6a5f4c",
  grid: "rgba(36, 33, 28, 0.1)",
  border: "#ddd2bc",
  primary: "#1d6164",
  surface: "#fbf8f1",
  tooltipBg: "rgba(251, 248, 241, 0.97)",
  tooltipBorder: "rgba(36, 33, 28, 0.18)",
  tooltipShadow: "0 14px 40px rgba(36, 33, 28, 0.14)",
  nullFill: "#d8cfbd",
  highlight: "#5f6b2c",
};

function read(): ChartTokens {
  if (typeof window === "undefined") return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const out = {} as ChartTokens;
  for (const key of Object.keys(TOKEN_MAP) as (keyof ChartTokens)[]) {
    const value = styles.getPropertyValue(TOKEN_MAP[key]).trim();
    out[key] = value || FALLBACK[key];
  }
  return out;
}

/**
 * Resolves a category's hue to a literal colour.
 *
 * Canvas charts cannot read CSS custom properties, so without this they fell
 * back to the payload palette while the SVG sunbursts used the --viz-cat-*
 * tokens — two different colours for the same category on adjacent pages.
 */
export function resolveCategoryColors(
  names: string[],
  fallback: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  const styles =
    typeof window === "undefined"
      ? null
      : getComputedStyle(document.documentElement);
  for (const name of names) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const token = styles?.getPropertyValue(`--viz-cat-${slug}`).trim();
    out[name] = token || fallback[name] || FALLBACK.primary;
  }
  return out;
}

export function useChartTokens(): ChartTokens {
  const theme = useTheme();
  const [tokens, setTokens] = useState<ChartTokens>(FALLBACK);
  useEffect(() => {
    setTokens(read());
  }, [theme]);
  return tokens;
}
