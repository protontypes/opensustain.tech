"use client";

import { useEffect } from "react";
import Link from "next/link";

import { formatNumber } from "@/lib/format";
import {
  getPickedCategory,
  setPickedCategory,
  usePickedCategory,
} from "@/lib/home/picked-category";
import { routes } from "@/lib/navigation";
import { categoryToken } from "@/lib/sunburst/color";

export type ExplorerCategory = {
  name: string;
  projects: number;
  subcategories: { name: string; projects: number }[];
};

function directoryHref(category: string, subcategory?: string): string {
  const params = new URLSearchParams({ cat: category });
  if (subcategory) params.set("sub", subcategory);
  return `${routes.projects}?${params.toString()}`;
}

/**
 * The thirteen categories as buttons, in README order, with the chosen one's
 * subcategories opened below them. Every subcategory links into the directory
 * already filtered, so this is a way in, not a second copy of the list. The
 * pick is shared with the ring in the hero, which outlines it.
 */
export function CategoryExplorer({ categories }: { categories: ExplorerCategory[] }) {
  // Opens on the biggest category, so the panel shows the most to pick from.
  const opening = categories.reduce(
    (best, c, i) => (c.projects > categories[best].projects ? i : best),
    0,
  );
  const pickedName = usePickedCategory();
  const found = categories.findIndex((c) => c.name === pickedName);
  const picked = found >= 0 ? found : opening;
  const current = categories[picked];

  // Names the opening pick so the ring can outline it before any click.
  useEffect(() => {
    if (getPickedCategory() === null) setPickedCategory(categories[opening].name);
  }, [categories, opening]);
  const hue = (name: string) => `var(${categoryToken(name)})`;

  return (
    <>
      <ul className="category-grid">
        {categories.map((category, i) => (
          <li key={category.name}>
            <button
              type="button"
              className="category-card"
              aria-pressed={i === picked}
              aria-controls="category-panel"
              onClick={() => setPickedCategory(category.name)}
            >
              <span className="category-card__top">
                <span className="category-card__dot" style={{ background: hue(category.name) }} />
                <span className="kicker">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className="category-card__name">{category.name}</span>
              <span className="category-card__meta">
                <span className="category-card__counts">
                  <span>{category.subcategories.length} subcategories</span>
                  <span>{formatNumber(category.projects)} projects</span>
                </span>
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div id="category-panel" className="category-panel" aria-live="polite">
        <div className="category-panel__bar" style={{ background: hue(current.name) }} />
        <div className="category-panel__body">
          <div className="category-panel__head">
            <h3 className="category-panel__title">{current.name}</h3>
            <Link className="pill pill--ink" href={directoryHref(current.name)}>
              See all {formatNumber(current.projects)} projects
            </Link>
          </div>
          <ul className="category-panel__subs">
            {current.subcategories.map((sub) => (
              <li key={sub.name}>
                <Link className="sub-pill" href={directoryHref(current.name, sub.name)}>
                  <span className="sub-pill__dot" style={{ background: hue(current.name) }} />
                  {sub.name}
                  <span className="sub-pill__count">{formatNumber(sub.projects)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
