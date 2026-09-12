"use client";

import { useMemo, useState } from "react";

import { useDirectory } from "@/lib/data/use-directory";
import { formatCompactNumber } from "@/lib/format";
import type { DirectoryProject } from "@/lib/types/directory";

/**
 * Search/filter over ~2,753 projects.
 *
 * Deliberately plain `useMemo` + `.filter()` string matching, not a search
 * library: every field it matches against is already an in-memory string on
 * a flat array this size, so a keystroke is a single pass over ~2,753 short
 * strings — sub-millisecond in any browser this site supports. A library
 * (Fuse.js, FlexSearch, ...) buys ranked/fuzzy matching this directory does
 * not ask for, at the cost of an index to build and keep in sync with the
 * category/subcategory filter below. Reconsider only if this grows a
 * fuzzy-match requirement or the item count grows by an order of magnitude.
 */
function matches(project: DirectoryProject, query: string): boolean {
  if (!query) return true;
  const haystack = `${project.name} ${project.description}`.toLowerCase();
  return haystack.includes(query);
}

function ProjectCard({ project }: { project: DirectoryProject }) {
  return (
    <li className="directory-card">
      <a
        className="directory-card__name"
        href={project.url}
        target="_blank"
        rel="noreferrer"
      >
        {project.name}
      </a>
      <p className="directory-card__description">{project.description}</p>
      <div className="directory-card__meta">
        {project.subcategory ? (
          <span className="directory-badge">{project.subcategory}</span>
        ) : null}
        {project.language ? (
          <span className="directory-badge">{project.language}</span>
        ) : null}
        {project.license ? (
          <span className="directory-badge">{project.license}</span>
        ) : null}
        {typeof project.stars === "number" ? (
          <span className="directory-badge directory-badge--stat">
            <i className="fa-solid fa-star" aria-hidden="true" />{" "}
            {formatCompactNumber(project.stars)}
          </span>
        ) : null}
        {project.source === "readme" ? (
          <span className="directory-badge directory-badge--pending" title="Recently added to the directory; metrics not yet synced.">
            Recently added
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function ProjectDirectory() {
  const { data, error } = useDirectory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => data?.categories.map((c) => c.name) ?? [], [data]);

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return data.categories
      .filter((cat) => category === "all" || cat.name === category)
      .map((cat) => ({
        name: cat.name,
        subcategories: cat.subcategories
          .map((sub) => ({
            name: sub.name,
            projects: sub.projects.filter((project) => matches(project, normalizedQuery)),
          }))
          .filter((sub) => sub.projects.length > 0),
      }))
      .filter((cat) => cat.subcategories.length > 0);
  }, [data, query, category]);

  const visibleCount = useMemo(
    () =>
      filteredCategories.reduce(
        (total, cat) =>
          total + cat.subcategories.reduce((n, sub) => n + sub.projects.length, 0),
        0,
      ),
    [filteredCategories],
  );

  if (error) {
    return (
      <p className="panel-description">
        The project directory could not be loaded ({error}). Try reloading the
        page.
      </p>
    );
  }

  if (!data) {
    return <p className="panel-description">Loading the project directory…</p>;
  }

  return (
    <div className="directory">
      <div className="directory-controls">
        <label className="viz-field viz-field--search">
          <span className="viz-field__label">Search</span>
          <input
            type="search"
            placeholder="Search by name or description…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="viz-field viz-field--select">
          <span className="viz-field__label">Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className="directory-count">
          Showing {visibleCount.toLocaleString()} of {data.totals.projects.toLocaleString()} projects
        </p>
      </div>

      {filteredCategories.length === 0 ? (
        <p className="panel-description">No projects match “{query}”.</p>
      ) : (
        filteredCategories.map((cat) => (
          <section key={cat.name} className="directory-category" id={slugify(cat.name)}>
            <h2 className="directory-category__title">{cat.name}</h2>
            {cat.subcategories.map((sub) => (
              <div key={sub.name ?? "_"} className="directory-subcategory">
                {sub.name ? <h3 className="directory-subcategory__title">{sub.name}</h3> : null}
                <ul className="directory-grid">
                  {sub.projects.map((project) => (
                    <ProjectCard key={project.url || project.name} project={project} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
