"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { param, useUrlState } from "@/lib/hooks/use-url-state";
import { useDirectory } from "@/lib/data/use-directory";
import { formatCompactNumber, formatNumber, pluralize } from "@/lib/format";
import { categoryColor } from "@/lib/sunburst/color";
import type { DirectoryPayload, DirectoryProject } from "@/lib/types/directory";

import { Avatar } from "@/components/ui/avatar";

import { ProjectDialog } from "./project-dialog";
import { formatMonthYear } from "./project-format";

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
  const haystack = `${project.name} ${project.description} ${(project.keywords ?? []).join(" ")}`.toLowerCase();
  return haystack.includes(query);
}

/**
 * A topic chip filters by the tag itself. Routed through the free-text search
 * it matched substrings, so the topic "r" found 2,756 of 2,762 projects.
 */
function hasTopic(project: DirectoryProject, topic: string): boolean {
  if (!topic) return true;
  return (project.keywords ?? []).some((keyword) => keyword.toLowerCase() === topic);
}

/** "All categories" / "All subcategories" sentinel used both in state and the URL. */
const ALL = "all";

/** Rows per page. Keeps the DOM small regardless of how many of the ~2,753
 * projects match the current filters — the alternative to virtualizing the
 * list, and simpler given no virtualization library is already a dependency
 * here. */
const PAGE_SIZE = 60;

/** Projects with no subcategory in the README are listed under this name. */
const GENERAL = "General";

type Group = {
  key: string;
  category: string;
  subcategory: string;
  projects: DirectoryProject[];
};

/**
 * Runs of consecutive projects that share a subcategory. The list is already
 * in README order, so a run is a whole subcategory — or, where a page break
 * falls inside one, the part of it on this page.
 */
function groupBySubcategory(projects: DirectoryProject[]): Group[] {
  const groups: Group[] = [];
  for (const project of projects) {
    const subcategory = project.subcategory ?? GENERAL;
    const last = groups[groups.length - 1];
    if (last && last.category === project.category && last.subcategory === subcategory) {
      last.projects.push(project);
    } else {
      groups.push({
        key: `${project.category}/${subcategory}`,
        category: project.category,
        subcategory,
        projects: [project],
      });
    }
  }
  return groups;
}

/** Flattens the category/subcategory tree into one README-ordered list —
 * every project already carries its own `category`/`subcategory`, so nothing
 * downstream needs the nesting. */
function flattenProjects(data: DirectoryProject[] | DirectoryPayload): DirectoryProject[] {
  if (Array.isArray(data)) return data;
  return data.categories.flatMap((cat) => cat.subcategories.flatMap((sub) => sub.projects));
}

/**
 * Opens the project overlay. A real button, stretched over its card or row by
 * `::after`, so the whole card is the click target while keyboard and
 * screen-reader users meet one named control per project.
 */
function OpenButton({
  project,
  onOpen,
}: {
  project: DirectoryProject;
  onOpen: (project: DirectoryProject) => void;
}) {
  return (
    <button
      type="button"
      className="directory-open"
      aria-haspopup="dialog"
      onClick={() => onOpen(project)}
    >
      {project.name}
    </button>
  );
}

function ProjectRow({
  project,
  onOpen,
}: {
  project: DirectoryProject;
  onOpen: (project: DirectoryProject) => void;
}) {
  const activity = formatMonthYear(project.latest_commit_activity);

  return (
    <li>
      <article className="directory-row">
        <div className="directory-row__main">
          <Avatar src={project.avatar_url} name={project.name} size={24} square />
          <div className="directory-row__text">
            <h3 className="directory-row__title">
              <OpenButton project={project} onOpen={onOpen} />
            </h3>
            <p className="directory-row__description">{project.description}</p>
          </div>
        </div>
        {/* Each cell names itself for a screen reader; sighted readers get the
            column header above the list instead. */}
        <span className="directory-row__cell directory-row__cell--lang">
          {project.language ? (
            <>
              <span className="visually-hidden">Language: </span>
              {project.language}
            </>
          ) : (
            <span className="directory-row__missing" aria-label="Language not reported">
              –
            </span>
          )}
        </span>
        <span className="directory-row__cell directory-row__cell--stat">
          {typeof project.stars === "number" ? (
            <>
              <span className="visually-hidden">Stars: </span>
              {formatCompactNumber(project.stars)}
            </>
          ) : (
            <span className="directory-row__missing" aria-label="Stars not available">
              –
            </span>
          )}
        </span>
        <span className="directory-row__cell directory-row__cell--activity">
          {activity ? (
            <>
              <span className="visually-hidden">Last commit: </span>
              {activity}
            </>
          ) : project.source === "readme" ? (
            <span
              className="directory-row__pending"
              title="Recently added to the directory; metrics not yet synced."
            >
              Recently added
            </span>
          ) : null}
        </span>
      </article>
    </li>
  );
}

/**
 * One subcategory: its heading, with the category's color from the sunburst,
 * and its rows. The count is for the whole subcategory under the current
 * filters, so a heading repeated after a page break still says how many there
 * are in all.
 */
function ProjectGroup({
  group,
  total,
  onOpen,
}: {
  group: Group;
  total: number;
  onOpen: (project: DirectoryProject) => void;
}) {
  // Names carry spaces and slashes; an id with a space is two ids to
  // aria-labelledby.
  const headingId = `group-${group.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section className="directory-group" aria-labelledby={headingId}>
      <header className="directory-group__head">
        <span
          className="directory-group__swatch"
          style={{ background: categoryColor(group.category, {}) }}
          aria-hidden="true"
        />
        <h2 id={headingId} className="directory-group__title">
          {group.subcategory}
        </h2>
        <p className="directory-group__category">{group.category}</p>
        <p className="directory-group__count">{pluralize(total, "project")}</p>
      </header>
      <ul className="directory-list">
        {group.projects.map((project) => (
          <ProjectRow key={project.url || project.name} project={project} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

/** Grey bar standing in for one run of text; `width` is roughly the text's. */
function Bar({ width }: { width: string }) {
  return <span className="sk sk-text" style={{ width }} />;
}

// Two placeholder groups of rows. Widths vary so it reads as a page of
// different projects rather than a pattern.
const SKELETON_GROUPS = [
  {
    title: "14em",
    rows: [
      { name: "9em", line: "78%" },
      { name: "6em", line: "64%" },
      { name: "11em", line: "82%" },
      { name: "7em", line: "56%" },
    ],
  },
  {
    title: "10em",
    rows: [
      { name: "8em", line: "70%" },
      { name: "12em", line: "60%" },
      { name: "6.5em", line: "76%" },
    ],
  },
];

/**
 * What the directory looks like before its payload has arrived: the same
 * controls, column header and grouped rows, with bars where the text will be.
 * The sizes come from the directory's own classes, so when the data lands the
 * rows replace the bars in place rather than the page jumping. Styles under
 * "loading skeleton" in globals.css; the pattern is Plug Map's index.html.
 */
function DirectorySkeleton() {
  return (
    <>
      <p className="visually-hidden" role="status">
        Loading the project directory…
      </p>
      <div className="directory directory--loading" aria-busy="true" aria-hidden="true">
        <div className="directory-controls">
          <div className="viz-field viz-field--search">
            <span className="viz-field__label">
              <Bar width="3.5em" />
            </span>
            <span className="sk sk-field sk-field--search" />
          </div>
          <div className="viz-field viz-field--select">
            <span className="viz-field__label">
              <Bar width="5em" />
            </span>
            <span className="sk sk-field" />
          </div>
          <div className="viz-field viz-field--select">
            <span className="viz-field__label">
              <Bar width="6.5em" />
            </span>
            <span className="sk sk-field" />
          </div>
          <p className="directory-count">
            <Bar width="10em" />
          </p>
        </div>

        <div className="directory-columns">
          <p className="directory-range">
            <Bar width="12em" />
          </p>
        </div>

        {SKELETON_GROUPS.map((group, index) => (
          <section key={index} className="directory-group">
            <div className="directory-group__head">
              <span className="directory-group__swatch sk" />
              <div className="directory-group__title">
                <Bar width={group.title} />
              </div>
            </div>
            <ul className="directory-list">
              {group.rows.map((row, line) => (
                <li key={line}>
                  <div className="directory-row">
                    <div className="directory-row__main sk-lines">
                      <Bar width={row.name} />
                      <Bar width={row.line} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

export function ProjectDirectory() {
  const { data, error } = useDirectory();
  const { params, write } = useUrlState();

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(ALL);
  const [subcategory, setSubcategory] = useState(ALL);
  const [page, setPage] = useState(1);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  // True while the open overlay has its own history entry, so closing it can
  // step back instead of leaving a duplicate entry behind.
  const pushedOverlay = useRef(false);

  // The URL wins over these defaults, and over Back/Forward — same pattern
  // as the analytics charts' `useUrlState` usage.
  useEffect(() => {
    if (!params) return;
    setQuery(param(params, "q", ""));
    setTopic(param(params, "topic", ""));
    setCategory(param(params, "cat", ALL));
    setSubcategory(param(params, "sub", ALL));
    const pageParam = Number(param(params, "page", "1"));
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    const project = params.get("project");
    setSelectedUrl(project);
    if (!project) pushedOverlay.current = false;
  }, [params]);

  /** Updates one or more filters, writes them to the address bar, and resets
   * to page 1 unless the patch is itself a page change. */
  const applyFilters = useCallback(
    (patch: { q?: string; topic?: string; cat?: string; sub?: string; page?: number }) => {
      const url: Record<string, string | null> = {};
      if (patch.q !== undefined) {
        setQuery(patch.q);
        url.q = patch.q || null;
      }
      if (patch.topic !== undefined) {
        setTopic(patch.topic);
        url.topic = patch.topic || null;
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

  // Its own history entry, so Back closes the overlay rather than leaving the
  // page — and the address can be shared to open straight onto a project.
  const openProject = useCallback(
    (project: DirectoryProject) => {
      pushedOverlay.current = true;
      write({ project: project.url }, "push");
    },
    [write],
  );

  const closeProject = useCallback(() => {
    if (pushedOverlay.current) {
      pushedOverlay.current = false;
      window.history.back();
    } else {
      write({ project: null });
    }
  }, [write]);

  const searchKeyword = useCallback(
    (keyword: string) => {
      pushedOverlay.current = false;
      write({ project: null });
      applyFilters({ topic: keyword, q: "", cat: ALL });
    },
    [write, applyFilters],
  );

  const allProjects = useMemo(() => (data ? flattenProjects(data) : []), [data]);

  const projectsByUrl = useMemo(
    () => new Map(allProjects.map((project) => [project.url, project])),
    [allProjects],
  );
  const selectedProject = selectedUrl ? (projectsByUrl.get(selectedUrl) ?? null) : null;

  const categories = useMemo(() => data?.categories.map((c) => c.name) ?? [], [data]);

  const subcategoriesForCategory = useMemo(() => {
    if (!data || category === ALL) return [];
    const cat = data.categories.find((c) => c.name === category);
    return cat ? cat.subcategories.map((s) => s.name ?? "General") : [];
  }, [data, category]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedTopic = topic.trim().toLowerCase();
    return allProjects.filter((project) => {
      if (category !== ALL && project.category !== category) return false;
      if (subcategory !== ALL && (project.subcategory ?? "General") !== subcategory) return false;
      if (!hasTopic(project, normalizedTopic)) return false;
      return matchesQuery(project, normalizedQuery);
    });
  }, [allProjects, query, topic, category, subcategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const visible = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );
  const groups = useMemo(() => groupBySubcategory(visible), [visible]);
  const groupTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const project of filtered) {
      const key = `${project.category}/${project.subcategory ?? GENERAL}`;
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return totals;
  }, [filtered]);

  if (error) {
    return (
      <div className="directory-error" role="alert">
        <p className="panel-description">
          The project directory could not be loaded ({error}).
        </p>
        <button type="button" className="viz-button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return <DirectorySkeleton />;
  }

  // Every filter in force, each removable on its own: a topic set from the
  // overlay has no control of its own on the page to undo it.
  const activeFilters: { key: string; label: string; clear: () => void }[] = [
    query ? { key: "q", label: `Search: ${query}`, clear: () => applyFilters({ q: "" }) } : null,
    topic ? { key: "topic", label: `Topic: ${topic}`, clear: () => applyFilters({ topic: "" }) } : null,
    category !== ALL
      ? { key: "cat", label: `Category: ${category}`, clear: () => applyFilters({ cat: ALL }) }
      : null,
    subcategory !== ALL
      ? { key: "sub", label: `Subcategory: ${subcategory}`, clear: () => applyFilters({ sub: ALL }) }
      : null,
  ].filter((filter): filter is { key: string; label: string; clear: () => void } => filter !== null);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, currentPage * PAGE_SIZE);

  return (
    <div className="directory">
      <div className="directory-controls">
        <label className="viz-field viz-field--search">
          <span className="viz-field__label">Search</span>
          <input
            type="search"
            placeholder="Name, description or topic"
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
          {activeFilters.length > 0 ? " match your filters" : ""}
        </p>
      </div>

      {activeFilters.length > 0 ? (
        <ul className="directory-filters" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <li key={filter.key}>
              <button
                type="button"
                className="directory-filter"
                onClick={filter.clear}
                aria-label={`Remove filter ${filter.label}`}
              >
                {filter.label}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
          {activeFilters.length > 1 ? (
            <li>
              <button
                type="button"
                className="directory-filters__clear"
                onClick={() => applyFilters({ q: "", topic: "", cat: ALL })}
              >
                Clear all
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      {filtered.length === 0 ? (
        <p className="panel-description">
          No projects match {activeFilters.map((filter) => filter.label).join(", ")}. Remove a
          filter above to widen the search.
        </p>
      ) : (
        <>
          {/* One header for every group's columns, on the rows' own grid. */}
          <div className="directory-columns">
            <p className="directory-range" aria-live="polite">
              Showing {formatNumber(rangeStart)}–{formatNumber(rangeEnd)} of {formatNumber(filtered.length)}
            </p>
            <span className="directory-columns__label" aria-hidden="true">Language</span>
            <span className="directory-columns__label directory-columns__label--end" aria-hidden="true">
              Stars
            </span>
            <span className="directory-columns__label directory-columns__label--end" aria-hidden="true">
              Last commit
            </span>
          </div>

          {groups.map((group) => (
            <ProjectGroup
              key={`${group.key}/${group.projects[0].url}`}
              group={group}
              total={groupTotals.get(group.key) ?? group.projects.length}
              onOpen={openProject}
            />
          ))}

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

      <ProjectDialog project={selectedProject} onClose={closeProject} onKeyword={searchKeyword} />
    </div>
  );
}
