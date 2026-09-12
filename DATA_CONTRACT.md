# Data contract for `/projects`

This documents where the project directory's data comes from, why, and the
exact numbers behind that decision. See `scripts/fetch-data.mjs` for the
implementation and its header comment for the fallback chain.

## The question

`open-sustainable-technology/README.md` is the ~2,767-entry awesome list and
stays the single source of truth contributors PR against. `opensustain.
analytics/data/projects.csv` is a separately-crawled dataset (via ecosyste.ms)
with much richer per-project metrics — stars, language, license, contributor
counts, commit activity, download counts — that the README never carried.

Does the CSV cover the README closely enough to use as the `/projects` data
source outright (richer, but a second-hand copy), or does the directory need
to parse README.md at build time and join in CSV metrics where they match?

## Method

`scripts/fetch-data.mjs` (`buildDirectory()`) parses every `## Category` /
`### Subcategory` / `- [name](url) - description` entry from README.md in
document order, normalizes each entry's URL (strip scheme/`www.`/trailing
slash/`.git`, lowercase) and joins it against `projects.csv`'s `git_url`
column normalized the same way, falling back to a normalized-name match when
the URL doesn't line up. This is the exact join the build runs, not a
separate audit script — the numbers below are what a real run prints.

## Result (run against README.md main + projects.csv as of 2026-09-12)

```
Total README list-item links (post-"Contents" section):  2,752 *
Total CSV data rows:                                      2,800
Matched by normalized URL:                                 2,554
Matched by normalized name (URL didn't line up):              123
Total matched:                                              2,677 / 2,752  (97.3%)
Unmatched (README-only):                                        75  (2.7%)
Matched entries missing category/sub_category/git_url/description in CSV:  0
```

\* A live `pnpm fetch-data` run pulls the current README over the network and
typically finds 2,753 entries — the list grows by a handful of PRs most weeks.
The percentages don't move meaningfully; treat the numbers above as the
snapshot this decision was made from, not a value to keep in sync by hand.

**Every one of the 2,677 matched entries has category, sub_category, url, and
description present in the CSV.** Zero field gaps.

**The 75 unmatched entries**, spot-checked individually (not a sampling
error): all 75 are genuinely absent from `projects.csv`, not present under a
different URL. They split two ways:
- **26 are GitHub repos** the crawler hasn't picked up yet — almost certainly
  README PRs merged more recently than the last analytics crawl/sync (e.g.
  `FBumann/fluxopt`, `ijbd/assetra`, `EAPD-DRB/MUIOGO`, `gwittebolle/
  claude-carbon`, `google-research/dinosaur`). Ordinary lag between two
  independently-updated repos, not a data-quality problem.
- **49 are non-GitHub hosts** (project homepages, SourceForge, Eclipse,
  university/agency sites — e.g. `sentinel-energy.github.io`, `sourceforge.
  net/projects/electricdss`, `openv2g.sourceforge.net`, `edgar.jrc.ec.europa.
  eu`) that the ecosyste.ms-based crawler behind `projects.csv` doesn't cover
  at all — it's built around API-queryable code-hosting platforms and package
  registries. These will not gain CSV metrics without a different crawl
  source, README-sync timing aside.

`organizations.csv` was compared too, for completeness: README.md has no
"Organizations" section (it's purely a project list — org names only appear
incidentally inside project descriptions), so there is nothing to join by URL
there. `organizations.csv` feeds only the existing `/organizations` analytics
page, unchanged, straight from the pre-built `organizations-overview.json` /
`organization-rankings.json` payloads.

## Decision: **hybrid, CSV-primary**

Not a clean `csv` per the task's literal "an entry for every README project"
test — 2.7% don't match — but not a `readme-parse` either, since a build that
threw away the CSV's metrics for 97.3% of projects to accommodate the other
2.7% would be strictly worse. The actual rule `buildDirectory()` runs:

1. Parse README.md at build time — it decides *which projects exist*, in
   *what order*, under *which category/subcategory* headings. The CSV is
   never used to add or drop a project the README doesn't list, or to
   reorder categories.
2. For each README entry, look up its CSV row by URL (falling back to name).
   Found → attach `homepage`, `stars`, `language`, `license`, `contributors`,
   `total_commits`, `downloads_last_month`, `score`, `platform`,
   `latest_commit_activity`, `project_created_at`, and prefer the CSV's
   `description` (fuller than most README one-liners). Tag `source: "csv"`.
   `homepage` is the project's own site from the CSV, distinct from `url`
   (whatever link the README happens to point at — usually, but not always,
   the repo); the directory card links to both when they differ.
3. Not found → keep the entry with only what the README itself has (name,
   url, description, category, subcategory). Tag `source: "readme"`, every
   metrics field `null`.

So 97.3% of `/projects` entries render with full metrics; the remaining 2.7%
still appear (nothing from the README is ever silently dropped) as a plain
link-and-description card, exactly like the original awesome list rendered
them, with no fabricated numbers.

## Output shape — `public/data/directory.json`

```ts
{
  generated_at: string;       // ISO timestamp of this build's fetch-data run
  source: "csv+readme" | "readme-only" | "fallback-snapshot";
  totals: {
    categories: number;
    subcategories: number;
    projects: number;
    matched_from_csv: number;
    matched_by_url: number;
    matched_by_name: number;
    readme_only: number;
  };
  categories: Array<{
    name: string;                    // README "## " heading, in README order
    subcategories: Array<{
      name: string | null;           // README "### " heading, in README order
      projects: Array<{
        name: string;
        url: string;
        description: string;
        category: string;
        subcategory: string | null;
        source: "csv" | "readme";
        // present only when source === "csv":
        homepage: string | null;
        stars: number | null;
        language: string | null;
        license: string | null;
        contributors: number | null;
        total_commits: number | null;
        downloads_last_month: number | null;
        score: number | null;
        platform: string | null;
        latest_commit_activity: string | null;
        project_created_at: string | null;
      }>;
    }>;
  }>;
}
```

## Where this is built and consumed

- **Built by**: `scripts/fetch-data.mjs`, run as a prebuild step
  (`pnpm build` → `node scripts/fetch-data.mjs && next build`). See that
  file's header for the three-tier fallback (remote → local sibling checkout
  → committed `public/data/fallback/` snapshot) that makes this resilient to
  no network / no sibling checkout.
- **Consumed by**: `app/projects/page.tsx` (the directory), via a loader in
  `lib/data/directory.ts` that reads `public/data/directory.json` the same
  way `lib/data/loaders.ts` reads the analytics payloads.
- **Not tracked in git**: `public/data/directory.json` is regenerated every
  build and is ~1.5 MB; `.gitignore` excludes it (see that file's comment).
  `public/data/fallback/directory.json` (all 13 categories, capped to 3
  projects per subcategory, ~130 KB) *is* tracked, so a fresh clone with no
  network and no sibling checkout still builds a real, representative site.

## Revisiting this later

Once `opensustain.analytics` publishes an actual data feed (tagged release or
dedicated branch — see `ANALYTICS_DATA_CSV_REMOTE_BASE` in `scripts/fetch-
data.mjs`), re-running the match is one command: `pnpm fetch-data` prints the
same totals block on every run. If the unmatched share ever climbs well past
~3%, that's a sign the crawler's coverage is falling behind the README rather
than just lagging it, and would be worth a source-side fix rather than a
bigger client-side fallback.
