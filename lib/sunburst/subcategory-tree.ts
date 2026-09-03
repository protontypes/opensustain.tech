import type { OrganizationsBySubcategoryPayload } from "@/lib/types";

import type { SunburstNode } from "./types";

export const SUBCATEGORY_ROOT_ID = "subcat-root";

/** Sentinel for an organization whose record carries no country or type. */
const UNKNOWN = "";

/**
 * Inverts `filters.sub_categories_by_category` into sub-category → category.
 *
 * The organizations-by-subcategory payload names its 81 sub-categories but not
 * their parent ecosystem category, and colouring them by their parent is what
 * keeps this chart's palette the same as the other two. The mapping is 1:1 —
 * no sub-category belongs to two categories.
 */
export function parentCategories(
  subCategoriesByCategory: Record<string, string[]>,
): Map<string, string> {
  const parents = new Map<string, string>();
  for (const [category, subs] of Object.entries(subCategoriesByCategory)) {
    for (const sub of subs) parents.set(sub, category);
  }
  return parents;
}

/**
 * Adapts the organizations-by-subcategory payload onto `SunburstNode`, so this
 * chart shares the renderer, geometry and tween with the other two.
 *
 * Built from `payload.subcategories` rather than `payload.root` — the two are
 * index-aligned and carry the same organizations, but the records also hold
 * `location_country` and `form_of_organization`, which the filters need.
 *
 * Every organization counts as one leaf: an organization listed under three
 * sub-categories is one wedge in each, which is what the Streamlit reference
 * does when it explodes the comma-separated sub-category column into rows
 * (tabs/organisations_by_subcategory_tab.py:29).
 */
export function buildSubcategoryTree(
  payload: OrganizationsBySubcategoryPayload,
  subCategoriesByCategory: Record<string, string[]>,
): SunburstNode {
  const parents = parentCategories(subCategoriesByCategory);

  const root: SunburstNode = {
    id: SUBCATEGORY_ROOT_ID,
    name: "Organizations by Sub-Category",
    kind: "root",
    depth: 0,
    category: "",
    children: [],
    parent: null,
    visibleLeaves: 0,
    totalLeaves: 0,
    activeLeaves: 0,
  };

  for (const record of payload.subcategories) {
    const category = parents.get(record.sub_category) ?? "";
    const subNode: SunburstNode = {
      id: `subcat:${record.sub_category}`,
      name: record.sub_category,
      kind: "sub_category",
      depth: 1,
      category,
      children: [],
      parent: root,
      visibleLeaves: 0,
      totalLeaves: 0,
      activeLeaves: 0,
      detail: {
        subtitle: category ? `Sub-category · ${category}` : "Sub-category",
        liveCountLabel: "Organizations",
        hint: "Click to see its organizations",
      },
    };

    for (const org of record.organizations) {
      const country = org.location_country?.trim() || UNKNOWN;
      // "Collaboration" and "collaboration" are the same type spelt two ways in
      // the source CSV; the filter matches on the lowercased form.
      const type = org.form_of_organization?.trim().toLowerCase() || UNKNOWN;
      subNode.children.push({
        id: `${subNode.id}/${org.organization_url || org.organization_name}`,
        name: org.organization_name,
        kind: "organization",
        // Inherits the sub-category's hue so a zoomed ring stays in family.
        category,
        depth: 2,
        children: [],
        parent: subNode,
        visibleLeaves: 1,
        totalLeaves: 1,
        activeLeaves: 1,
        detail: {
          url: org.organization_url || undefined,
          subtitle: `Organization · ${record.sub_category}`,
          country,
          orgType: type,
          stats: [
            { label: "Country", value: country || "Not recorded" },
            { label: "Type", value: titleCase(type) || "Not recorded" },
          ],
          hint: org.organization_url
            ? "Click to open the organization"
            : "No organization page recorded",
        },
      });
    }

    subNode.totalLeaves = subNode.children.length;
    subNode.activeLeaves = subNode.totalLeaves;
    subNode.visibleLeaves = subNode.totalLeaves;
    root.children.push(subNode);
  }

  root.totalLeaves = root.children.reduce((sum, s) => sum + s.totalLeaves, 0);
  root.activeLeaves = root.totalLeaves;
  root.visibleLeaves = root.totalLeaves;
  return root;
}

export type SubcategoryFilterResult = {
  /** Sub-categories with at least one organization left. */
  subcategories: number;
  /** Listings shown; an organization in three sub-categories counts three times. */
  listings: number;
  /** Distinct organizations behind those listings. */
  organizations: number;
  /** Listings hidden by the active filters. */
  hidden: number;
};

/**
 * Applies the page's filters by setting each leaf's `visibleLeaves`, then rolls
 * the counts back up.
 *
 * @param include decided by the page filter bar, which owns the country and
 * type controls for every chart on the organizations page.
 */
export function applySubcategoryFilters(
  root: SunburstNode,
  include: (org: SunburstNode) => boolean,
): SubcategoryFilterResult {
  const distinct = new Set<string>();
  let listings = 0;
  let hidden = 0;
  let subcategories = 0;

  for (const sub of root.children) {
    let kept = 0;
    for (const org of sub.children) {
      const keep = include(org);
      org.visibleLeaves = keep ? 1 : 0;
      if (keep) {
        kept += 1;
        distinct.add(org.detail?.url || org.name);
      } else {
        hidden += 1;
      }
    }
    sub.visibleLeaves = kept;
    listings += kept;
    if (kept > 0) subcategories += 1;
  }

  root.visibleLeaves = listings;
  return { subcategories, listings, organizations: distinct.size, hidden };
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}
