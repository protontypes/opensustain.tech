import type { MetadataRoute } from "next";

import { routes } from "@/lib/navigation";
import { SITE_URL } from "@/lib/seo/site";

// Every route this static export actually serves as a page — matches
// `next.config.ts`'s `trailingSlash: true`, so these are the exact URLs
// visitors and crawlers land on, not a redirect hop away from them.
// Deliberately excludes the legacy redirect stubs (app/spreadsheet,
// app/contributing, etc.) — those are `robots: {index: false}` and have no
// business in a sitemap. `routes.blogPost` isn't included: it's a function,
// not a path, and this repo doesn't yet know what posts exist to enumerate
// (see docs/migration for the open item on generating this once /blog does).
const paths: string[] = [
  routes.home,
  routes.projects,
  routes.analytics,
  routes.analyticsProjects,
  routes.organizations,
  routes.topics,
  routes.methodology,
  routes.blog,
  routes.presentations,
  routes.about,
  routes.privacyPolicy,
];

function withTrailingSlash(path: string): string {
  return path === "/" || path.endsWith("/") ? path : `${path}/`;
}

// Required for a route handler under `output: "export"` — there's no
// request to serve this dynamically at, so it has to be resolvable at
// build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return paths.map((path) => ({
    url: `${SITE_URL}${withTrailingSlash(path)}`,
    lastModified,
  }));
}
