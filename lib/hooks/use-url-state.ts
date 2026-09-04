"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Chart state in the address bar.
 *
 * Every control on every route was local React state that never reached the
 * URL, so a reader who drilled the sunburst into a category, switched the
 * metric and isolated two categories could not send that view to anyone — the
 * address was still `/`. Back exited the page instead of undoing a drill-down,
 * and nothing could deep-link into another route with a filter preselected.
 *
 * This writes with `history.replaceState` rather than Next's router: the state
 * is client-only, so a router navigation would re-render the route for nothing,
 * and `useSearchParams` would opt these statically prerendered pages into
 * client-side rendering unless every chart were wrapped in a Suspense boundary.
 *
 * `params` is null until after mount. Reading `window.location` during render
 * would differ between the server's markup and the browser's, which is a
 * hydration mismatch — so callers fall back to their defaults for one frame,
 * which is invisible behind the payload fetch every chart already waits on.
 */
export type UrlWriteMode = "replace" | "push";

export function useUrlState() {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    const read = () => setParams(new URLSearchParams(window.location.search));
    read();
    // Back and Forward have to be heard, or the address bar and the chart
    // disagree after a drill-down is undone.
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const write = useCallback(
    (patch: Record<string, string | null>, mode: UrlWriteMode = "replace") => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      const url = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      // push only for what reads as navigation — a drill-down. Doing it for
      // every select would put a history entry behind each keystroke.
      window.history[mode === "push" ? "pushState" : "replaceState"](
        null,
        "",
        url,
      );
      setParams(next);
    },
    [],
  );

  return { params, write };
}

/** Reads one param, falling back before the URL has been read. */
export function param(
  params: URLSearchParams | null,
  key: string,
  fallback: string,
): string {
  return params?.get(key) ?? fallback;
}

/** Reads a comma-separated list, ignoring empties. */
export function listParam(
  params: URLSearchParams | null,
  key: string,
): string[] {
  const raw = params?.get(key);
  if (!raw) return [];
  return raw.split(",").map((part) => part.trim()).filter(Boolean);
}
