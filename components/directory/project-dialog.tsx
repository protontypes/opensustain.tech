"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { formatCompactNumber, formatDecimal, formatLicense, formatNumber } from "@/lib/format";
import { communityDiscordUrl, ostGithubUrl, routes } from "@/lib/navigation";
import { categoryToken } from "@/lib/sunburst/color";
import type { DirectoryProject } from "@/lib/types/directory";

import {
  displayUrl,
  distinctHomepage,
  formatMonthYear,
  isGithubUrl,
} from "./project-format";

type Stat = { label: string; value: string };

const present = (stats: (Stat | null)[]) => stats.filter((stat): stat is Stat => stat !== null);

/**
 * Four headline figures as a strip, the rest as a short list: ten identical
 * tiles gave a language name the same weight as a contributor count. Platform
 * is left out; the repository link below already names the host.
 */
function projectStats(project: DirectoryProject): { headline: Stat[]; details: Stat[] } {
  const lastCommit = formatMonthYear(project.latest_commit_activity);
  const created = formatMonthYear(project.project_created_at);
  return {
    headline: present([
      typeof project.stars === "number"
        ? { label: "Stars", value: formatCompactNumber(project.stars) }
        : null,
      typeof project.contributors === "number"
        ? { label: "Contributors", value: formatNumber(project.contributors) }
        : null,
      typeof project.total_commits === "number"
        ? { label: "Commits", value: formatCompactNumber(project.total_commits) }
        : null,
      lastCommit ? { label: "Last commit", value: lastCommit } : null,
    ]),
    details: present([
      project.language ? { label: "Language", value: project.language } : null,
      project.license ? { label: "License", value: formatLicense(project.license) } : null,
      // Zero for most projects that publish no package, so only shown when real.
      project.downloads_last_month
        ? { label: "Downloads / month", value: formatCompactNumber(project.downloads_last_month) }
        : null,
      project.score
        ? { label: "Ecosyste.ms score", value: formatDecimal(project.score, 1) }
        : null,
      created ? { label: "Created", value: created } : null,
    ]),
  };
}

// A new issue on the list's repo with the entry already named, so a
// correction does not start with "which project?".
function correctionUrl(project: DirectoryProject): string {
  const category = [project.category, project.subcategory].filter(Boolean).join(" › ");
  const body = [
    `Project: ${project.name}`,
    `Repository: ${project.url}`,
    `Category: ${category}`,
    "",
    "What is wrong or missing:",
    "",
  ].join("\n");
  const params = new URLSearchParams({ title: `Correction: ${project.name}`, body });
  return `${ostGithubUrl}/issues/new?${params.toString()}`;
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

  const stats = project ? projectStats(project) : { headline: [], details: [] };
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
            <Avatar src={project.avatar_url} name={project.name} size={56} square />
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

          {stats.headline.length + stats.details.length > 0 ? (
            <section aria-labelledby="project-dialog-stats">
              <h3 id="project-dialog-stats" className="project-dialog__section-title">
                At a glance
              </h3>
              {stats.headline.length > 0 ? (
                <dl className="project-dialog__metrics">
                  {stats.headline.map((stat) => (
                    <div key={stat.label} className="project-dialog__metric">
                      <dt>{stat.label}</dt>
                      <dd>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {stats.details.length > 0 ? (
                <dl className="project-dialog__facts">
                  {stats.details.map((stat) => (
                    <div key={stat.label} className="project-dialog__fact">
                      <dt>{stat.label}</dt>
                      <dd>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <p className="project-dialog__source">
                Collected automatically by Ecosyste.ms, not reviewed by the
                maintainers.{" "}
                <Link className="inline-link" href={routes.methodology}>
                  How these are measured
                </Link>
              </p>
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
                      aria-label={`Show projects tagged ${keyword}`}
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
            The name, description and category come from the curated list.
            Something wrong or missing?{" "}
            <a className="inline-link" href={correctionUrl(project)} target="_blank" rel="noreferrer">
              Report it on GitHub
            </a>{" "}
            or{" "}
            <a className="inline-link" href={communityDiscordUrl} target="_blank" rel="noreferrer">
              tell us on Discord
            </a>
            .
          </p>
        </div>
      ) : null}
    </dialog>
  );
}
