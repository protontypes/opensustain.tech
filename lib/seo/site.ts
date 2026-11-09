/**
 * The origin (plus base path) this static export is actually served from.
 *
 * Needed by anything that has to emit an absolute URL at build time —
 * `metadataBase` and the og:image/og:url it resolves, `app/sitemap.ts`,
 * `app/robots.ts`, and any `alternates.canonical` on a redirect stub — since
 * a static export has no request to read a host from.
 *
 * deploy.yml sets NEXT_PUBLIC_SITE_URL from actions/configure-pages'
 * `base_url`: "https://protontypes.github.io/opensustain.tech" before a
 * custom domain is attached, "https://opensustain.tech" once it is. Hardcoding
 * the domain pointed every social preview at an image that domain didn't
 * serve yet, so Discord, Slack etc. showed none. Falls back to `public/CNAME`.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://opensustain.tech").replace(
  /\/+$/,
  "",
);
