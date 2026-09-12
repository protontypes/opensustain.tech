"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { param, useUrlState } from "@/lib/hooks/use-url-state";
import { useDirectory } from "@/lib/data/use-directory";
import { formatCompactNumber, formatNumber } from "@/lib/format";
import type { DirectoryPayload, DirectoryProject } from "@/lib/types/directory";

/**
 * Search/filter over ~2,753 projects.
 *
 * Deliberately plain `useMemo` + `.filter()` string matching, not a search
 * library: every field it matches against is already an in-memory string on
 * a flat array this size, so a keystroke is a single pass over ~2,753 short
 * strings — sub-millisecond in any browser this site supports. A library
 * (Fuse.js, FlexSearch, ...) buys ranked/fuzzy matching this directory does
 * not ask for, at the cost of an index to build and keep in sync with the
 * category/subcategory filters below. Reconsider only if this grows a
 * fuzzy-match requirement or the item count grows by an order of magnitude.
 */
function matchesQuery(project: DirectoryProject, query: string): boolean {
  if (!query) return true;
  const haystack = `${project.name} ${project.description}`.toLowerCase();
  return haystack.includes(query);
}

/** "All categories" / "All subcategories" sentinel used both in state and the URL. */
const ALL = "all";

/** Cards per page. Keeps the DOM small regardless of how many of the ~2,753
 * projects match the current filters — the alternative to virtualizing the
 * list, and simpler given no virtualization library is already a dependency
 * here. */
const PAGE_SIZE = 60;

function normalizeForCompare(url: string | null | undefined): string {
  if (!url) return "";
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\/(www\.)?/i, "")
    .toLowerCase();
}

function isGithubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\//i.test(url);
}

function formatMonthYear(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

/** Flattens the category/subcategory tree into one README-ordered list —
 * every project already carries its own `category`/`subcategory`, so nothing
 * downstream needs the nesting. */
function flattenProjects(data: DirectoryPayload): DirectoryProject[] {
  return data.categories.flatMap((cat) => cat.subcategories.flatMap((sub) => sub.projects));
}

function ProjectCard({ project }: { project: DirectoryProject }) {
  const activity = project.latest_commit_activity ? formatMonthYear(project.latest_commit_activity) : null;
  const hasDistinctHomepage =
    project.homepage && normalizeForCompare(project.homepage) !== normalizeForCompare(project.url);
  const repoIsGithub = isGithubUrl(project.url);

  return (
    <li className="directory-card">
      <a className="directory-card__name" href={project.url} target="_blank" rel="noreferrer">
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
            <i className="fa-solid fa-star" aria-hidden="true" /> {formatCompactNumber(project.stars)}
          </span>
        ) : null}
        {activity ? (
          <span className="directory-badge directory-badge--stat" title="Latest commit activity">
            <i className="fa-solid fa-code-commit" aria-hidden="true" /> {activity}
          </span>
        ) : null}
        {project.source === "readme" ? (
          <span
            className="directory-badge directory-badge--pending"
            title="Recently added to the directory; metrics not yet synced."
          >
            Recently added
          </span>
        ) : null}
      </div>
      <div className="directory-card__links">
        <a
          className="directory-card__link"
          href={project.url}
          target="_blank"
          rel="noreferrer"
        >
          <i className={repoIsGithub ? "fa-brands fa-github" : "fa-solid fa-code-branch"} aria-hidden="true" />
          {repoIsGithub ? "GitHub" : "Source"}
        </a>
        {hasDistinctHomepage ? (
          <a
            className="directory-card__link"
            href={project.homepage as string}
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            Homepage
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function ProjectDirectory() {
  const { data, error } = useDirectory();
  const { params, write } = useUrlState();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [subcategory, setSubcategory] = useState(ALL);
  const [page, setPage] = useState(1);

  // The URL wins over these defaults, and over Back/Forward — same pattern
  // as the analytics charts' `useUrlState` usage.
  useEffect(() => {
    if (!params) return;
    setQuery(param(params, "q", ""));
    setCategory(param(params, "cat", ALL));
    setSubcategory(param(params, "sub", ALL));
    const pageParam = Number(param(params, "page", "1"));
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
  }, [params]);

  /** Updates one or more filters, writes them to the address bar, and resets
   * to page 1 unless the patch is itself a page change. */
  const applyFilters = useCallback(
    (patch: { q?: string; cat?: string; sub?: string; page?: number }) => {
      const url: Record<string, string | null> = {};
      if (patch.q !== undefined) {
        setQuery(patch.q);
        url.q = patch.q || null;
      }
      if (patch.cat !== undefined) {
        setCategory(patch.cat);
        setSubcategory(ALL);
        url.cat = patch.cat === ALL ? null : patch.cat;
        url.sub = null;
      }
      if (patch.sub !== undefined) {
        setSubcategory(patch.sub);
        url.sub = patch.sub === ALL ? null : patch.sub;
      }
      if (patch.page !== undefined) {
        setPage(patch.page);
        url.page = patch.page > 1 ? String(patch.page) : null;
      } else {
        setPage(1);
        url.page = null;
      }
      write(url);
    },
    [write],
  );

  const allProjects = useMemo(() => (data ? flattenProjects(data) : []), [data]);

  const categories = useMemo(() => data?.categories.map((c) => c.name) ?? [], [data]);

  const subcategoriesForCategory = useMemo(() => {
    if (!data || category === ALL) return [];
    const cat = data.categories.find((c) => c.name === category);
    return cat ? cat.subcategories.map((s) => s.name ?? "General") : [];
  }, [data, category]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allProjects.filter((project) => {
      if (category !== ALL && project.category !== category) return false;
      if (subcategory !== ALL && (project.subcategory ?? "General") !== subcategory) return false;
      return matchesQuery(project, normalizedQuery);
    });
  }, [allProjects, query, category, subcategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const visible = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  if (error) {
    return (
      <p className="panel-description">
        The project directory could not be loaded ({error}). Try reloading the page.
      </p>
    );
  }

  if (!data) {
    return <p className="panel-description">Loading the project directory…</p>;
  }

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, currentPage * PAGE_SIZE);

  return (
    <div className="directory">
      <div className="directory-controls">
        <label className="viz-field viz-field--search">
          <span className="viz-field__label">Search</span>
          <input
            type="search"
            placeholder="Search by name or description…"
            value={query}
            onChange={(event) => applyFilters({ q: event.target.value })}
          />
        </label>
        <label className="viz-field viz-field--select">
          <span className="viz-field__label">Category</span>
          <select value={category} onChange={(event) => applyFilters({ cat: event.target.value })}>
            <option value={ALL}>All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="viz-field viz-field--select">
          <span className="viz-field__label">Subcategory</span>
          <select
            value={subcategory}
            disabled={category === ALL}
            onChange={(event) => applyFilters({ sub: event.target.value })}
          >
            <option value={ALL}>{category === ALL ? "Choose a category first" : "All subcategories"}</option>
            {subcategoriesForCategory.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className="directory-count">
          {formatNumber(filtered.length)} of {formatNumber(data.totals.projects)} projects
          {query || category !== ALL || subcategory !== ALL ? " match your filters" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="panel-description">No projects match “{query}”. Try a different search or filter.</p>
      ) : (
        <>
          <p className="directory-range" aria-live="polite">
            Showing {formatNumber(rangeStart)}–{formatNumber(rangeEnd)} of {formatNumber(filtered.length)}
          </p>
          <ul className="directory-grid">
            {visible.map((project) => (
              <ProjectCard key={project.url || project.name} project={project} />
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav className="directory-pagination" aria-label="Project directory pages">
              <button
                type="button"
                className="viz-button"
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ page: currentPage - 1 })}
              >
                Previous
              </button>
              <span className="directory-pagination__pages">
                Page {formatNumber(currentPage)} of {formatNumber(totalPages)}
              </span>
              <button
                type="button"
                className="viz-button"
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters({ page: currentPage + 1 })}
              >
                Next
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
