"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { formatNumber } from "@/lib/format";

import styles from "./multi-select-field.module.css";

export type MultiSelectOption = {
  value: string;
  label: string;
  /** Heading the option is listed under, e.g. a sub-category's category. */
  group?: string;
  /** CSS colour for a swatch beside the label. */
  swatch?: string;
};

/**
 * A select that takes several values.
 *
 * A disclosure over native checkboxes rather than `<select multiple>`, which
 * needs Ctrl/Cmd-click to add a second value and draws as an always-open list
 * box. The search is what turns "every energy category" into one action: type
 * "energy", then "Select 3 matching" (or press Enter).
 */
export function MultiSelectField({
  label,
  noun,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  /** Plural, for the summary and search copy: "categories". */
  noun: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const selected = useMemo(() => new Set(value), [value]);

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        (option.group ?? "").toLowerCase().includes(needle),
    );
  }, [options, query]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, MultiSelectOption[]>();
    for (const option of matching) {
      const key = option.group ?? "";
      const list = byGroup.get(key) ?? [];
      list.push(option);
      byGroup.set(key, list);
    }
    return [...byGroup.entries()];
  }, [matching]);

  useEffect(() => {
    if (!open) {
      // Reopening starts from the full list, not the last search.
      setQuery("");
      return;
    }
    searchRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Emit in the options' own order, so the summary and the URL do not depend
  // on the order the boxes were ticked in.
  function emit(next: Set<string>) {
    onChange(options.filter((option) => next.has(option.value)).map((option) => option.value));
  }

  function toggle(optionValue: string) {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    emit(next);
  }

  function selectMatching() {
    emit(new Set([...selected, ...matching.map((option) => option.value)]));
  }

  const allMatchingSelected =
    matching.length > 0 && matching.every((option) => selected.has(option.value));

  const summary =
    value.length === 0
      ? `All ${noun}`
      : value.length === 1
        ? (options.find((option) => option.value === value[0])?.label ?? value[0])
        : `${formatNumber(value.length)} ${noun}`;

  return (
    <div className={styles.field} ref={rootRef}>
      <span className="viz-field__label" id={`${id}-label`}>
        {label}
      </span>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-labelledby={`${id}-label ${id}-trigger`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.summary}>{summary}</span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>

      <div
        id={`${id}-panel`}
        className={styles.panel}
        role="group"
        aria-labelledby={`${id}-label`}
        hidden={!open}
      >
        <input
          ref={searchRef}
          type="search"
          className={styles.search}
          placeholder={`Search ${noun}…`}
          aria-label={`Search ${noun}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!allMatchingSelected) selectMatching();
            }
          }}
        />

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={selectMatching}
            disabled={allMatchingSelected || matching.length === 0}
          >
            {query.trim()
              ? `Select ${formatNumber(matching.length)} matching`
              : "Select all"}
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={() => onChange([])}
            disabled={value.length === 0}
          >
            Clear
          </button>
        </div>

        <div className={styles.list}>
          {groups.length === 0 ? (
            <p className={styles.empty}>
              No {noun} match “{query.trim()}”.
            </p>
          ) : (
            groups.map(([group, items]) => (
              <div key={group || "_"} role="group" aria-label={group || undefined}>
                {group ? (
                  <p className={styles.group} aria-hidden="true">
                    {group}
                  </p>
                ) : null}
                {items.map((option) => (
                  <label key={option.value} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={selected.has(option.value)}
                      onChange={() => toggle(option.value)}
                    />
                    {option.swatch ? (
                      <span
                        className={styles.swatch}
                        style={{ background: option.swatch }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
