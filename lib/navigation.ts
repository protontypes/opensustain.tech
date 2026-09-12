/**
 * Every route on opensustain.tech, in one place.
 *
 * This is the file downstream page work should never need to touch: routes
 * for pages that don't exist yet (blog, about, presentations, privacy
 * policy) are registered here already, so a page landing at exactly the
 * right path is enough to make it navigable — no edit here required. Adding
 * a genuinely new route is the one reason to come back to this file.
 */

export const routes = {
  home: "/",

  // The OST project directory — ~2,767 projects grouped by category and
  // subcategory, built from README.md + data/projects.csv. See
  // DATA_CONTRACT.md. This is NOT the project-rankings dashboard; that one
  // moved to /analytics/projects when this path was freed up for the
  // directory (see the "Analytics nav item" note in the site-shell report).
  projects: "/projects",

  // Analytics section. `analytics` is a small landing page (this repo's
  // former "/" overview) linking out to the four dashboards below it;
  // organizations/topics/methodology kept their original top-level paths
  // unchanged rather than moving under /analytics/*, since nothing required
  // moving them and every existing internal link/bookmark to them keeps
  // working.
  analytics: "/analytics",
  analyticsProjects: "/analytics/projects",
  organizations: "/organizations",
  topics: "/topics",
  methodology: "/methodology",

  // Not built yet — other agents create pages at exactly these paths.
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}` as const,
  about: "/about",
  presentations: "/presentations",
  privacyPolicy: "/privacy-policy",
} as const;

/** Header navigation, in display order. */
export const primaryNavigation = [
  { href: routes.projects, label: "Projects" },
  { href: routes.analytics, label: "Analytics" },
  { href: routes.blog, label: "Blog" },
  { href: routes.presentations, label: "Presentations" },
  { href: routes.about, label: "About" },
] as const;

/** Header links that leave the site, appended after primaryNavigation. */
export const externalNavigation = [
  {
    href: "https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md",
    label: "Contribute",
  },
  { href: "https://climatetriage.com/", label: "ClimateTriage" },
] as const;

/** Footer link columns. */
export const footerNavigation = [
  { href: routes.projects, label: "Projects" },
  { href: routes.analytics, label: "Analytics" },
  { href: routes.organizations, label: "Organizations" },
  { href: routes.topics, label: "Topics" },
  { href: routes.methodology, label: "Methodology" },
  { href: routes.blog, label: "Blog" },
  { href: routes.presentations, label: "Presentations" },
  { href: routes.about, label: "About" },
] as const;

/** opensustain.tech's social presence, listed in mkdocs.yml `extra.social`. */
export const socialLinks = [
  { href: "https://mastodon.social/@opensustaintech", label: "Mastodon" },
  { href: "https://linkedin.com/company/protontypes", label: "LinkedIn" },
  {
    href: "https://bsky.app/profile/opensustaintech.bsky.social",
    label: "Bluesky",
  },
] as const;

/** OpenSustain.tech community Discord, linked from the header as ClimateTriage does. */
export const communityDiscordUrl = "https://discord.gg/JDUatGKxve";

/** The GitHub repo contributors send directory PRs against. */
export const ostGithubUrl =
  "https://github.com/protontypes/open-sustainable-technology";
