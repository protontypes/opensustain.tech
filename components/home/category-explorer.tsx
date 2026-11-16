"use client";

import Link from "next/link";

import { formatNumber } from "@/lib/format";
import { setPickedCategory, usePickedCategory } from "@/lib/home/picked-category";
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

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * The thirteen categories as a map key, in README order: swatch, name, a bar
 * for its share of projects, and its count. One opens at a time onto its
 * subcategories, largest first, each linking into the directory already
 * filtered. The open one is shared with the ring in the hero, which outlines
 * it; all closed, the ring shows no outline.
 */
export function CategoryExplorer({ categories }: { categories: ExplorerCategory[] }) {
  const picked = usePickedCategory();
  const largest = Math.max(...categories.map((c) => c.projects));
  const hue = (name: string) => `var(${categoryToken(name)})`;

  return (
    <ul className="category-key">
      {categories.map((category) => {
        const open = category.name === picked;
        const panelId = `category-key-${slug(category.name)}`;
        const subcategories = [...category.subcategories].sort((a, b) => b.projects - a.projects);
        return (
          <li key={category.name} className="category-key__item">
            <button
              type="button"
              className="category-key__toggle"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setPickedCategory(open ? null : category.name)}
            >
              <span className="category-key__swatch" style={{ background: hue(category.name) }} />
              <span>
                <span className="category-key__name">{category.name}</span>
                <span className="category-key__share" aria-hidden="true">
                  <span
                    style={{
                      width: `${(category.projects / largest) * 100}%`,
                      background: hue(category.name),
                    }}
                  />
                </span>
              </span>
              <span className="category-key__count">
                {formatNumber(category.projects)}
                <span className="visually-hidden"> projects</span>
              </span>
            </button>
            <div id={panelId} hidden={!open}>
              <ul className="category-key__subs">
                {subcategories.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      className="category-key__sub"
                      href={directoryHref(category.name, sub.name)}
                    >
                      <span>{sub.name}</span>
                      <span className="category-key__sub-count">
                        {formatNumber(sub.projects)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="category-key__all" href={directoryHref(category.name)}>
                See all {formatNumber(category.projects)} projects in {category.name}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
