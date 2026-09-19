"use client";

import { useEffect } from "react";

import { withBasePath } from "@/lib/base-path";
import {
  buildLegacyAnchorMap,
  legacyAnchorTargetToPath,
} from "@/lib/seo/legacy-anchors";

type LegacyAnchorRedirectProps = {
  subCategoriesByCategory: Record<string, string[]>;
};

/**
 * The old opensustain.tech "/" was mkdocs' rendering of README.md, and its
 * in-page table of contents linked to every category/subcategory as a
 * heading anchor (e.g. `/#photovoltaics-and-solar-energy`). A same-origin
 * link or bookmark built against that keeps working as a URL — it still
 * lands on this "/" — but the fragment now points at nothing on the new
 * homepage. This resends it on to the equivalent `/projects` filter instead
 * of leaving the visitor stranded wherever the hero section happens to be.
 *
 * Client-only and render-nothing: a URL fragment is never sent to the
 * server, so there's no way to resolve or redirect on it before the page
 * has already loaded in a browser.
 */
export function LegacyAnchorRedirect({
  subCategoriesByCategory,
}: LegacyAnchorRedirectProps) {
  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "");
    if (!fragment) return;

    const target = buildLegacyAnchorMap(subCategoriesByCategory)[
      fragment.toLowerCase()
    ];
    if (!target) return;

    window.location.replace(withBasePath(legacyAnchorTargetToPath(target)));
  }, [subCategoriesByCategory]);

  return null;
}
