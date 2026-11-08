/**
 * Every route on opensustain.tech, in one place.
 *
 * A page landing at exactly a path registered here is enough to make it
 * navigable. Adding a genuinely new route is the one reason to come back to
 * this file.
 */

export const routes = {
  home: "/",

  // The OST project directory — every project README.md lists, grouped by
  // category and subcategory, joined with data/projects.csv. This is NOT
  // the project-rankings dashboard; that one
  // moved to /analytics/projects when this path was freed up for the
  // directory.
  projects: "/projects",

  // education.md's courses, books and tutorials. Not projects, so not in the
  // directory: their own list and their own count.
  education: "/education",

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
} as const;

/** Shared under the "Articles & talks" heading on both of its tabs, /blog and /blog/talks. */
export const MEDIA_DESCRIPTION =
  "Articles and conference talks from the Open Sustainable Technology community on open source, climate technology and environmental sustainability.";

/**
 * The analytics dashboards, in the order the header's Analytics dropdown and
 * the mobile menu list them. Overview comes first since it is where the
 * section's own link always led.
 */
export const analyticsNavigation = [
  { href: routes.analytics, label: "Overview", description: "Ecosystem totals and the sunburst" },
  { href: routes.analyticsProjects, label: "Projects", description: "Rankings, growth and activity" },
  { href: routes.organizations, label: "Organizations", description: "Who maintains what, and where" },
  { href: routes.topics, label: "Topics", description: "Recurring keywords and themes" },
  { href: routes.methodology, label: "Methodology", description: "Sources and metric definitions" },
] as const;

/** The contributing guide. The home page hero's "Add a project" button links here too. */
export const contributeLink = {
  href: "https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md",
  label: "Contribute",
} as const;

export const climateTriageLink = {
  href: "https://climatetriage.com/",
  label: "ClimateTriage",
} as const;

/** OpenSustain.tech community Discord, linked from the header as ClimateTriage does. */
export const communityDiscordUrl = "https://discord.gg/JDUatGKxve";

/**
 * The header's "Get involved" dropdown: every way to help, all of them off
 * site. The Discord link also sits in the community banner, but that one can
 * be dismissed.
 */
export const getInvolvedNavigation = [
  {
    href: contributeLink.href,
    label: "Add a project",
    description: "Suggest a project for the directory on GitHub",
    external: true,
  },
  {
    href: climateTriageLink.href,
    label: "Good first issues",
    description: "Beginner-friendly issues on ClimateTriage",
    external: true,
  },
  {
    href: communityDiscordUrl,
    label: "Join the Discord",
    description: "Talk with the Open Sustainable Technology community",
    external: true,
  },
] as const;

/**
 * Header navigation, in display order. An item with `children` is a dropdown;
 * its own `href` is only a key, since the toggle is a button, not a link.
 */
export const primaryNavigation = [
  { href: routes.projects, label: "Directory" },
  { href: routes.education, label: "Learning resources" },
  { href: routes.analytics, label: "Analytics", children: analyticsNavigation },
  { href: routes.blog, label: "Articles & talks" },
  { href: routes.about, label: "About" },
  { href: contributeLink.href, label: "Get involved", children: getInvolvedNavigation },
] as const;

/** Footer link columns. */
export const footerNavigation = [
  {
    heading: "Data",
    links: [
      { href: routes.projects, label: "Directory" },
      { href: routes.education, label: "Learning resources" },
      { href: routes.analytics, label: "Analytics" },
      { href: routes.analyticsProjects, label: "Project analytics" },
      { href: routes.organizations, label: "Organizations" },
      { href: routes.topics, label: "Topics" },
      { href: routes.methodology, label: "Methodology" },
    ],
  },
  {
    heading: "Read",
    links: [
      { href: routes.blog, label: "Articles" },
      { href: routes.talks, label: "Talks" },
    ],
  },
  {
    heading: "Project",
    links: [
      { href: routes.about, label: "About" },
      { href: `${routes.about}#contact`, label: "Contact" },
    ],
  },
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

/** The GitHub repo contributors send directory PRs against. */
export const ostGithubUrl =
  "https://github.com/protontypes/open-sustainable-technology";
