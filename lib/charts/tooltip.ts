import type { ChartTokens } from "@/lib/hooks/use-chart-tokens";

export type TooltipRow = { label: string; value: string; strong?: boolean };

/**
 * The tooltip's chrome, shared by every ECharts chart.
 *
 * Seven charts repeated this block, each hardcoding a drop shadow tuned for a
 * light background — `--viz-tooltip-shadow` exists and has a dark value.
 */
export function tooltipChrome(tokens: ChartTokens) {
  return {
    confine: true,
    backgroundColor: tokens.tooltipBg,
    borderColor: tokens.tooltipBorder,
    borderWidth: 1,
    extraCssText: `box-shadow:${tokens.tooltipShadow};border-radius:12px`,
  };
}

/**
 * Builds an ECharts tooltip as real DOM.
 *
 * ECharts formatters accept an HTMLElement, which sidesteps the HTML-string
 * interpolation the previous charts used — those dropped project names and
 * descriptions from a third-party CSV straight into markup.
 */
export function buildTooltip(
  tokens: ChartTokens,
  {
    title,
    subtitle,
    rows,
    note,
  }: {
    title: string;
    subtitle?: string;
    rows?: TooltipRow[];
    note?: string;
  },
): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText = `font-family:var(--font-heading);max-width:300px;color:${tokens.ink}`;

  const heading = document.createElement("p");
  heading.textContent = title;
  heading.style.cssText = `margin:0;font-size:15px;font-weight:700;letter-spacing:-0.02em;color:${tokens.inkStrong}`;
  root.appendChild(heading);

  if (subtitle) {
    const sub = document.createElement("p");
    sub.textContent = subtitle;
    sub.style.cssText = `margin:3px 0 0;font-size:12px;font-weight:500;color:${tokens.muted}`;
    root.appendChild(sub);
  }

  if (rows?.length) {
    const list = document.createElement("dl");
    list.style.cssText = "margin:10px 0 0;display:grid;gap:2px";
    for (const row of rows) {
      const line = document.createElement("div");
      line.style.cssText =
        "display:flex;justify-content:space-between;gap:16px;align-items:baseline";
      const dt = document.createElement("dt");
      dt.textContent = row.label;
      dt.style.cssText = `font-size:12px;font-weight:500;color:${tokens.muted}`;
      const dd = document.createElement("dd");
      dd.textContent = row.value;
      dd.style.cssText = `margin:0;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:${
        row.strong ? tokens.primary : tokens.ink
      }`;
      line.append(dt, dd);
      list.appendChild(line);
    }
    root.appendChild(list);
  }

  if (note) {
    const hint = document.createElement("p");
    hint.textContent = note;
    hint.style.cssText = `margin:10px 0 0;font-size:11px;font-weight:500;color:${tokens.muted}`;
    root.appendChild(hint);
  }

  return root;
}
