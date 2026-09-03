"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks the resolved theme.
 *
 * SiteHeader mutates `document.documentElement` imperatively rather than
 * through React state, so a component that needs to recompute on theme change
 * has to observe the attribute directly. The media-query listener covers the
 * "no explicit choice yet" case.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): "light" | "dark" {
  const attribute = document.documentElement.getAttribute("data-theme");
  if (attribute === "dark") return "dark";
  if (attribute === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
