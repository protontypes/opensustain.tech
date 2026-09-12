/**
 * The production origin this static export is served from.
 *
 * Needed by anything that has to emit an absolute URL at build time —
 * `app/sitemap.ts`, `app/robots.ts`, and any `alternates.canonical` on a
 * redirect stub — since a static export has no request to read a host from.
 * Matches `public/CNAME` and `mkdocs.yml`'s old `site_url`.
 */
export const SITE_URL = "https://opensustain.tech";
