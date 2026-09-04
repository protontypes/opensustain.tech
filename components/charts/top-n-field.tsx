"use client";

import { formatNumber } from "@/lib/format";

const CHOICES = [10, 25, 50, 100];

/**
 * Top-N select, standing in for the Streamlit sliders.
 *
 * The last option is always the full set rather than an arbitrary ceiling, so
 * no chart quietly truncates without offering the rest.
 */
export function TopNField({
  value,
  onChange,
  max,
  noun,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  noun: string;
}) {
  // A caller's default need not be one of these choices — it can sit above
  // every one of them (25 against 24 licenses) or between two of them (30
  // against [10, 25, 50, …]). A <select> whose value matches no option silently
  // shows its first, so the control read "Top 10" while 24 rows were drawn, and
  // "All 300 keywords" while 30 were. Fold the value in rather than drop it.
  const options = [
    ...new Set([...CHOICES.filter((choice) => choice < max), Math.min(value, max), max]),
  ].sort((a, b) => a - b);

  return (
    <label className="viz-field viz-field--select">
      <span className="viz-field__label">Show</span>
      <select
        value={Math.min(value, max)}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((choice) => (
          <option key={choice} value={choice}>
            {choice === max
              ? `All ${formatNumber(max)} ${noun}`
              : `Top ${choice}`}
          </option>
        ))}
      </select>
    </label>
  );
}
