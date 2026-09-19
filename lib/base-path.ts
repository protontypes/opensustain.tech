/**
 * The subpath the site is served under, when that is not the root of a
 * domain: "/opensustain.tech" on protontypes.github.io before a custom domain
 * is attached, "" once it is.
 *
 * Set at build time through NEXT_PUBLIC_BASE_PATH, which deploy.yml takes
 * from actions/configure-pages, so it empties itself when the domain moves.
 * next.config.ts hands the same value to Next's `basePath`, which covers
 * <Link>, the router and /_next assets. `withBasePath` is for the paths the
 * code builds itself: fetch URLs, <img src>, plain <a href> and
 * window.location.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/** Prefixes a root-relative path ("/data/x.json") with the base path. */
export function withBasePath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? `${BASE_PATH}${path}` : path;
}
