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
  const options = [...CHOICES.filter((choice) => choice < max), max];
  // A caller's default can sit above every option — a top-25 default against
  // 24 licenses — and a <select> whose value matches nothing falls back to its
  // first option, so the control read "Top 10" while all 24 were drawn.
  const selected = options.includes(value) ? value : max;

  return (
    <label className="viz-field viz-field--select">
      <span className="viz-field__label">Show</span>
      <select
        value={selected}
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
