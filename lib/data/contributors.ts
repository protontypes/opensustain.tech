/**
 * GitHub contributors for protontypes/open-sustainable-technology, for the
 * /about page's contributors grid.
 *
 * Fetched at build time (this file is only ever imported by the /about
 * server component, and `output: "export"` renders every route once during
 * `next build` — there is no request-time server to call this again) from
 * the GitHub REST API, paginated to get all of them rather than just the
 * first page. Authenticate with a `GITHUB_TOKEN` env var when set — GitHub's
 * unauthenticated rate limit is 60 requests/hour per IP, which a CI runner
 * can share with other jobs and exhaust — but this also works with none:
 * the repo is public and two pages of contributors is two requests.
 *
 * Any failure (no token and rate-limited, offline, GitHub down, an
 * unexpected response shape) falls back to the snapshot committed at
 * public/data/fallback/contributors.json, so the build never hard-fails for
 * lack of network. That file is a plain trimmed copy of the same API
 * response — see scripts/update-contributors-fallback.mjs to refresh it.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const REPO = "protontypes/open-sustainable-technology";
const API_URL = `https://api.github.com/repos/${REPO}/contributors`;
const PER_PAGE = 100;
/** Hard stop so a misbehaving API can't paginate this build forever. */
const MAX_PAGES = 20;

export type Contributor = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

type ContributorsSnapshot = {
  generated_at: string;
  source: string;
  contributors: Contributor[];
};

function fallbackPath(rootDir = process.cwd()): string {
  return path.join(rootDir, "public", "data", "fallback", "contributors.json");
}

function toContributor(raw: unknown): Contributor | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.login !== "string" ||
    typeof r.id !== "number" ||
    typeof r.avatar_url !== "string" ||
    typeof r.html_url !== "string" ||
    typeof r.contributions !== "number"
  ) {
    return null;
  }
  return {
    login: r.login,
    id: r.id,
    avatar_url: r.avatar_url,
    html_url: r.html_url,
    contributions: r.contributions,
  };
}

/** Fetches every page of live contributors, or null on any failure. */
async function fetchLiveContributors(): Promise<Contributor[] | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "opensustain-tech-about-page",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const all: Contributor[] = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await fetch(
        `${API_URL}?per_page=${PER_PAGE}&page=${page}&anon=0`,
        { headers },
      );

      if (!response.ok) {
        console.warn(
          `[about] GitHub contributors fetch failed (${response.status} ${response.statusText}); using the committed fallback snapshot instead.`,
        );
        return null;
      }

      const body: unknown = await response.json();
      if (!Array.isArray(body)) {
        console.warn(
          "[about] GitHub contributors response was not an array; using the committed fallback snapshot instead.",
        );
        return null;
      }

      const batch = body.map(toContributor).filter((c): c is Contributor => c !== null);
      all.push(...batch);

      if (body.length < PER_PAGE) break; // last page
    }
    return all;
  } catch (error) {
    console.warn(
      "[about] GitHub contributors fetch threw (offline / DNS / network); using the committed fallback snapshot instead.",
      error,
    );
    return null;
  }
}

async function loadFallbackContributors(rootDir = process.cwd()): Promise<Contributor[]> {
  const raw = await readFile(fallbackPath(rootDir), "utf-8");
  const parsed: ContributorsSnapshot = JSON.parse(raw);
  return parsed.contributors;
}

export type ContributorsResult = {
  contributors: Contributor[];
  /** Whether this came from a live GitHub API call this build, vs. the committed fallback. */
  source: "live" | "fallback";
};

export async function loadContributors(rootDir = process.cwd()): Promise<ContributorsResult> {
  const live = await fetchLiveContributors();
  if (live && live.length > 0) {
    return { contributors: live, source: "live" };
  }
  const fallback = await loadFallbackContributors(rootDir);
  return { contributors: fallback, source: "fallback" };
}
