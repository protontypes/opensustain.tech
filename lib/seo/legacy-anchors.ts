/**
 * Maps legacy heading anchors from the old mkdocs site's homepage — which
 * rendered `open-sustainable-technology/README.md` verbatim at "/" — to the
 * new `/projects` directory's category/subcategory filter.
 *
 * The README's `## Category` / `### Subcategory` headings got GitHub- and
 * Python-Markdown-style anchor ids there (`toc: permalink: true` in
 * mkdocs.yml), so a link like `/#photovoltaics-and-solar-energy` was really
 * a link to the "Photovoltaics and Solar Energy" subcategory section. Both
 * slug algorithms agree on every one of this taxonomy's 93 category/
 * subcategory names, which are plain ASCII words and spaces with nothing
 * else to disagree on (verified against `public/data/directory.json` — see
 * DATA_CONTRACT.md), so this reproduces those ids without fetching or
 * re-parsing README.md at runtime; the categories/subcategories to slug come
 * from the same taxonomy the /projects directory already loads
 * (`filters.sub_categories_by_category`, identical to directory.json's
 * category tree since both are built from the same README headings).
 */

export function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type LegacyAnchorTarget = {
  category: string;
  subcategory: string | null;
};

/**
 * A subcategory name that appeared under more than one category would slug
 * to the same id in two different places in the README and can't be
 * resolved unambiguously from the fragment alone, so it's dropped rather
 * than guessed at. As of the current taxonomy none collide (all 80
 * subcategory names are globally unique) — this just keeps that true if a
 * future README reuses a name.
 */
export function buildLegacyAnchorMap(
  subCategoriesByCategory: Record<string, string[]>,
): Record<string, LegacyAnchorTarget> {
  const map: Record<string, LegacyAnchorTarget> = {};
  const subcategoryOwners: Record<string, Set<string>> = {};

  for (const [category, subcategories] of Object.entries(subCategoriesByCategory)) {
    const categorySlug = slugifyHeading(category);
    if (!(categorySlug in map)) {
      map[categorySlug] = { category, subcategory: null };
    }

    for (const subcategory of subcategories) {
      const slug = slugifyHeading(subcategory);
      (subcategoryOwners[slug] ??= new Set()).add(category);
      map[slug] = { category, subcategory };
    }
  }

  for (const [slug, owners] of Object.entries(subcategoryOwners)) {
    if (owners.size > 1) delete map[slug];
  }

  return map;
}

/** The `/projects` filter query for a resolved legacy anchor target. */
export function legacyAnchorTargetToPath(target: LegacyAnchorTarget): string {
  const params = new URLSearchParams({ category: target.category });
  if (target.subcategory) params.set("subcategory", target.subcategory);
  return `/projects?${params.toString()}`;
}
