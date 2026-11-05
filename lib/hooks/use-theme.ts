"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks the resolved theme.
 *
 * SiteHeader mutates `document.documentElement` imperatively rather than
 * through React state, so a component that needs to recompute on theme change
 * has to observe the attribute directly. The OS preference plays no part:
 * the site is light unless the visitor chooses dark.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export function useTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
