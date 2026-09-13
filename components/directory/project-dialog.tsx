"use client";

import { useEffect, useRef } from "react";

import { formatCompactNumber, formatDecimal, formatNumber } from "@/lib/format";
import { contributeLink } from "@/lib/navigation";
import { categoryToken } from "@/lib/sunburst/color";
import type { DirectoryProject } from "@/lib/types/directory";

import {
  displayUrl,
  distinctHomepage,
  formatMonthYear,
  isGithubUrl,
} from "./project-format";

type Stat = { label: string; value: string };

function projectStats(project: DirectoryProject): Stat[] {
  const stats: (Stat | null)[] = [
    typeof project.stars === "number"
      ? { label: "Stars", value: formatCompactNumber(project.stars) }
      : null,
    typeof project.contributors === "number"
      ? { label: "Contributors", value: formatNumber(project.contributors) }
      : null,
    typeof project.total_commits === "number"
      ? { label: "Commits", value: formatCompactNumber(project.total_commits) }
      : null,
    // Zero for most projects that publish no package, so only shown when real.
    project.downloads_last_month
      ? { label: "Downloads / month", value: formatCompactNumber(project.downloads_last_month) }
      : null,
    project.score
      ? { label: "Ecosyste.ms score", value: formatDecimal(project.score, 1) }
      : null,
    project.language ? { label: "Language", value: project.language } : null,
    project.license ? { label: "License", value: project.license } : null,
    project.platform ? { label: "Platform", value: project.platform } : null,
  ];
  const created = formatMonthYear(project.project_created_at);
  const lastCommit = formatMonthYear(project.latest_commit_activity);
  if (created) stats.push({ label: "Created", value: created });
  if (lastCommit) stats.push({ label: "Last commit", value: lastCommit });
  return stats.filter((stat): stat is Stat => stat !== null);
}

type ProjectLink = { href: string; label: string; icon: string };

function projectLinks(project: DirectoryProject): ProjectLink[] {
  const repoIsGithub = isGithubUrl(project.url);
  const links: ProjectLink[] = [
    {
      href: project.url,
      label: repoIsGithub ? "Repository on GitHub" : "Source",
      icon: repoIsGithub ? "fa-brands fa-github" : "fa-solid fa-code-branch",
    },
  ];
  const homepage = distinctHomepage(project);
  if (homepage) {
    links.push({ href: homepage, label: "Homepage", icon: "fa-solid fa-house" });
  }
  for (const href of project.funding_links ?? []) {
    links.push({ href, label: "Sponsor this project", icon: "fa-solid fa-heart" });
  }
  return links;
}

/**
 * A project's details, over the directory.
 *
 * The native `<dialog>` with `showModal()` supplies what a hand-rolled overlay
 * would have to rebuild: focus moves in and is held there, the page behind is
 * inert, Escape closes it, and focus returns to the card that opened it.
 * Escape and backdrop clicks go through `onClose` rather than letting the
 * element close itself, so the parent's state (and the URL) stay the one
 * source of truth for whether it is open.
 */
export function ProjectDialog({
  project,
  onClose,
  onKeyword,
}: {
  project: DirectoryProject | null;
  onClose: () => void;
  /** Search the directory for a topic. */
  onKeyword: (keyword: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  const stats = project ? projectStats(project) : [];
  const links = project ? projectLinks(project) : [];
  const keywords = project?.keywords ?? [];

  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // The body fills the dialog, so only the backdrop targets it directly.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {project ? (
        <div className="project-dialog__body">
          <button
            type="button"
            className="project-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>

          <header className="project-dialog__header">
            {project.avatar_url ? (
              // Static export + a third-party image host: plain <img>, as
              // components/ui/avatar.tsx does. Decorative beside the name.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="project-dialog__avatar"
                src={project.avatar_url}
                alt=""
                width={56}
                height={56}
              />
            ) : null}
            <div className="project-dialog__heading">
              <h2 id="project-dialog-title" className="project-dialog__title">
                {project.name}
              </h2>
              <p className="project-dialog__taxonomy">
                <span
                  className="project-dialog__swatch"
                  style={{ background: `var(${categoryToken(project.category)}, var(--color-link))` }}
                  aria-hidden="true"
                />
                {project.category}
                {project.subcategory ? (
                  <>
                    <span aria-hidden="true">›</span>
                    {project.subcategory}
                  </>
                ) : null}
              </p>
            </div>
          </header>

          {project.description ? (
            <p className="project-dialog__description">{project.description}</p>
          ) : null}

          {project.source === "readme" ? (
            <p className="project-dialog__note">
              Recently added to the directory — metrics appear once the next
              data sync picks it up.
            </p>
          ) : null}

          {stats.length > 0 ? (
            <section aria-labelledby="project-dialog-stats">
              <h3 id="project-dialog-stats" className="project-dialog__section-title">
                At a glance
              </h3>
              <dl className="project-dialog__stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="project-dialog__stat">
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {keywords.length > 0 ? (
            <section aria-labelledby="project-dialog-topics">
              <h3 id="project-dialog-topics" className="project-dialog__section-title">
                Topics
              </h3>
              <ul className="project-dialog__topics">
                {keywords.map((keyword) => (
                  <li key={keyword}>
                    <button
                      type="button"
                      className="project-dialog__topic"
                      onClick={() => onKeyword(keyword)}
                      aria-label={`Search the directory for ${keyword}`}
                    >
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                      {keyword}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="project-dialog-links">
            <h3 id="project-dialog-links" className="project-dialog__section-title">
              Links
            </h3>
            <ul className="project-dialog__links">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    className="project-dialog__link"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className={`project-dialog__link-icon ${link.icon}`} aria-hidden="true" />
                    <span className="project-dialog__link-text">
                      <span className="project-dialog__link-label">{link.label}</span>
                      <span className="project-dialog__link-url">{displayUrl(link.href)}</span>
                    </span>
                    <i
                      className="project-dialog__link-arrow fa-solid fa-arrow-up-right-from-square"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="project-dialog__footer">
            Something wrong or missing?{" "}
            <a className="inline-link" href={contributeLink.href} target="_blank" rel="noreferrer">
              Suggest an edit on GitHub
            </a>
          </p>
        </div>
      ) : null}
    </dialog>
  );
}
