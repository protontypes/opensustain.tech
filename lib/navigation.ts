/**
 * Every route on opensustain.tech, in one place.
 *
 * A page landing at exactly a path registered here is enough to make it
 * navigable. Adding a genuinely new route is the one reason to come back to
 * this file.
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

  // Media: articles and talks, one header entry with a tab per route (see
  // components/media/media-tabs.tsx). Articles keep the /blog path so every
  // old mkdocs /blog/<slug>/ URL still resolves; the old /presentations URL
  // is a redirect stub to `talks`. `talks` is a static segment, so it wins
  // over /blog/[slug] — never publish a post with the slug "talks".
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}` as const,
  talks: "/blog/talks",
  about: "/about",
  privacyPolicy: "/privacy-policy",
} as const;

/** Shared under the "Media" heading on both of its tabs, /blog and /blog/talks. */
export const MEDIA_DESCRIPTION =
  "Articles and conference talks from the OpenSustain.tech community on open source, climate technology and environmental sustainability.";

/** Header navigation, in display order. */
export const primaryNavigation = [
  { href: routes.projects, label: "Projects" },
  { href: routes.analytics, label: "Analytics" },
  { href: routes.blog, label: "Media" },
  { href: routes.about, label: "About" },
] as const;

/** The header's one call to action, rendered as a button, not a nav link. */
export const contributeLink = {
  href: "https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md",
  label: "Contribute",
} as const;

export const climateTriageLink = {
  href: "https://climatetriage.com/",
  label: "ClimateTriage",
} as const;

/** Both ways to act on the ecosystem off-site, as the homepage hero lists them. */
export const externalNavigation = [contributeLink, climateTriageLink] as const;

/** Footer link columns. */
export const footerNavigation = [
  { href: routes.projects, label: "Projects" },
  { href: routes.analytics, label: "Analytics" },
  { href: routes.organizations, label: "Organizations" },
  { href: routes.topics, label: "Topics" },
  { href: routes.methodology, label: "Methodology" },
  { href: routes.blog, label: "Articles" },
  { href: routes.talks, label: "Talks" },
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
