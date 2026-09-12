#!/usr/bin/env node
/**
 * Refreshes public/data/fallback/contributors.json — the committed snapshot
 * the /about page's contributors grid falls back to when a live GitHub API
 * call fails at build time (see lib/data/contributors.ts).
 *
 * Not wired into `pnpm build` or `pnpm fetch-data`: this snapshot is a
 * fallback of last resort, not build output, so it only needs refreshing
 * occasionally by a human, not on every build. Run by hand:
 *
 *   node scripts/update-contributors-fallback.mjs
 *
 * Set GITHUB_TOKEN in the environment to avoid the 60 req/hour
 * unauthenticated rate limit (this repo has ~101 contributors, so two pages
 * / two requests either way — a token just adds headroom).
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "protontypes/open-sustainable-technology";
const API_URL = `https://api.github.com/repos/${REPO}/contributors`;
const PER_PAGE = 100;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "fallback",
  "contributors.json",
);

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "opensustain-tech-about-page",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const all = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `${API_URL}?per_page=${PER_PAGE}&page=${page}&anon=0`,
      { headers },
    );
    if (!response.ok) {
      throw new Error(
        `GitHub contributors fetch failed: ${response.status} ${response.statusText}`,
      );
    }
    const batch = await response.json();
    all.push(
      ...batch.map((c) => ({
        login: c.login,
        id: c.id,
        avatar_url: c.avatar_url,
        html_url: c.html_url,
        contributions: c.contributions,
      })),
    );
    if (batch.length < PER_PAGE) break;
  }

  const snapshot = {
    generated_at: new Date().toISOString(),
    source: API_URL,
    contributors: all,
  };

  await writeFile(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${all.length} contributors to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
