"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The debounced search box the ecosystem sunburst has always had.
 *
 * Both organisation sunbursts rendered the highlight-capable renderer with
 * `matches={null}` and offered no way to search it, so finding a named
 * organisation among 276 wedges — or among the hundreds behind any of the 81
 * sub-categories — meant hovering them one at a time.
 */
export function SunburstSearch({
  query,
  onQuery,
  placeholder,
  label = "Search",
}: {
  query: string;
  onQuery: (query: string) => void;
  placeholder: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(query);

  // Held in a ref so the debounce depends only on what was typed. Keying it on
  // the callback restarts the timer on every parent render, and with an inline
  // arrow prop it then never settles.
  const onQueryRef = useRef(onQuery);
  onQueryRef.current = onQuery;

  useEffect(() => {
    const timer = setTimeout(() => onQueryRef.current(draft.trim()), 180);
    return () => clearTimeout(timer);
  }, [draft]);

  // Follows an external reset without fighting the user's own typing.
  useEffect(() => {
    setDraft((current) => (query === "" && current !== "" ? "" : current));
  }, [query]);

  return (
    <label className="viz-field viz-field--search">
      <span className="viz-field__label">{label}</span>
      <input
        type="search"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
      />
    </label>
  );
}
