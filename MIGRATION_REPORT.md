# Migration report — opensustain.tech

Status as of 2026-09-12: build/typecheck green, link and redirect crawl
clean, content parity confirmed, and all real design-consistency findings
from the latest review fixed. Nothing has been pushed anywhere, no remote
has been created, and DNS/CNAME has not been touched — see "Manual cutover"
below for the steps a human still needs to run.

## Where this is, and how to run it

Repo: `/home/abdul-salam/Devv/protontypes/opensustain.tech` (git, branch
`main`, clean working tree).

Requirements: Node.js 18.18+, pnpm (pinned via `packageManager` in
`package.json` to `pnpm@10.34.5`).

```bash
pnpm install      # install dependencies
pnpm dev          # local dev server
pnpm typecheck    # tsc --noEmit
pnpm build        # scripts/fetch-data.mjs, then `next build` (output: "export") -> out/
pnpm fetch-data   # refresh public/data/*.json on its own, without a full build
```

Env vars — all optional, every one has a safe fallback so a bare
`pnpm install && pnpm build` on a machine with no extra setup still produces
a real site:

- `GITHUB_TOKEN` — used only by `lib/data/contributors.ts` to authenticate
  GitHub's REST API when building the `/about` contributors grid.
  Unauthenticated is 60 requests/hour/IP, which is fine for this public repo's
  contributor count today but can be exhausted by a shared CI runner. Falls
  back to the committed snapshot at `public/data/fallback/contributors.json`
  on any failure (no token, rate-limited, offline, GitHub down). The current
  `.github/workflows/deploy.yml` does **not** set this env var — worth adding
  (`env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` on the build step) as a
  cheap improvement, but not required.
- `OST_ANALYTICS_REPO_PATH`, `OST_README_REPO_PATH` — point
  `scripts/fetch-data.mjs` at local sibling checkouts of
  `opensustain.analytics` / `open-sustainable-technology` instead of its
  default relative-path guesses. Only matters for local dev; CI has no
  sibling checkouts and uses the next fallback tier instead.
- `ANALYTICS_DATA_REMOTE_BASE`, `OST_README_REMOTE_URL` and friends — remote
  URLs `scripts/fetch-data.mjs` prefers over a sibling checkout when
  reachable (README.md already has a real one on `raw.githubusercontent.com`;
  the analytics JSON payloads don't yet — see `docs/migration/README.md`'s
  patch for `opensustain.analytics`, which is what will give them one).

Every data source has a three-tier fallback (remote -> local sibling
checkout -> committed snapshot in `public/data/fallback/`), so the build
never hard-fails for lack of network or a sibling clone — confirmed by this
task's own `pnpm build` run, which used the local sibling checkouts present
on this machine for the analytics JSON/CSV and the live GitHub raw URL for
README.md.

## Data contract decision

Hybrid (CSV-primary): `open-sustainable-technology/README.md` decides which
~2,753 projects exist, their order, and their category/subcategory grouping
— it's the document contributors actually send PRs against. Each README
entry is then joined to `opensustain.analytics/data/projects.csv` by
normalized URL (fallback: normalized name) to pull in richer per-project
metrics (stars, language, license, contributor counts, commit activity,
download counts) that the README itself never carried.

Pure `"csv"` was rejected: ~2.7% of README entries have no CSV row at all
(they'd silently disappear from the directory). Pure `"readme-parse"` was
rejected too: it would discard the CSV's richer metrics for the 97.3% of
entries that do match.

Match statistics (from a real `fetch-data.mjs` run against README.md `main` +
`projects.csv`, documented with full method in `DATA_CONTRACT.md`):

```
README list-item links (post-"Contents" section): 2,752
  (a live run typically finds ~2,753 — the list grows by a few PRs most weeks)
CSV rows:                                          2,800
Matched by normalized URL:                         2,554
Matched by normalized name only:                     123
Total matched:                                    2,677 / 2,752  (97.3%)
Unmatched (README-only, source: "readme"):            75  (2.7%)
Matched entries missing category/sub_category/git_url/description in CSV: 0
```

All 75 unmatched entries were individually spot-checked as genuinely absent
from the CSV, not a normalization miss: 26 are GitHub repos not yet swept up
by the analytics crawler (README PRs merged more recently than the last
crawl), 49 are non-GitHub hosts (SourceForge, Eclipse, university/agency
sites, project homepages) the ecosyste.ms-based crawler behind `projects.csv`
doesn't cover at all. Those 75 still render on `/projects`, just without
metrics.

`organizations.csv` was also checked: README.md has no dedicated
Organizations section, so there's nothing to join there — it continues to
feed only the existing `/organizations` page via its own pre-built JSON
payloads, unrelated to this decision.

Output shape: `public/data/directory.json` (generated by
`scripts/fetch-data.mjs`, gitignored, ~1.5MB) —
`categories[].subcategories[].projects[]`, each project carrying
name/url/description/category/subcategory/source, plus (when
`source === "csv"`) stars/language/license/contributors/total_commits/
downloads_last_month/score/platform/latest_commit_activity/
project_created_at. A trimmed snapshot is committed at
`public/data/fallback/directory.json` (~130KB, all 13 categories/80
subcategories, capped to 3 projects per subcategory) so offline/no-sibling
builds still produce a real, populated `/projects` page. Full decision,
method, and shape: `DATA_CONTRACT.md`.

## Pages / routes in the finished site

Real content pages:

- `/` — homepage
- `/projects` — the project directory (see data contract above)
- `/analytics` — landing page for the dashboards below
- `/analytics/projects` — project rankings, lifecycle, and attribute charts
- `/organizations` — organization geography, hierarchy, and rankings
- `/topics` — keyword and topic analysis
- `/methodology` — where the data comes from and its known limits
- `/blog` — blog index, grouped by year
- `/blog/[slug]` — 12 posts: `introducing_openSustain_analytics`,
  `climatetriage-relaunch`, `openclimatefund`, `closing-the-gap`,
  `sustain-open-source`, `launch_climate_triage`,
  `the_open_source_sustainability_ecosystem`,
  `you_can_preserve_the_earth_s_livability_with_open_source`,
  `impact_and_potential_of_open_source_on_climate_technology`,
  `openness_as_a_key_indicator_for_sustainable_investment`,
  `open_principles_for_a_sustainable_technology_transition`,
  `gathering_open_sustainable_technology`
- `/about` — team + live (build-time) GitHub contributors grid
- `/presentations` — talks and conference appearances
- `/privacy-policy`
- `/sitemap.xml`, `/robots.txt` — generated (`app/sitemap.ts`, `app/robots.ts`)
- `/_not-found` (404)

Redirect stubs (old mkdocs URL -> new destination; all `noindex, follow` with
a meta-refresh + canonical, see `components/seo/redirect-stub.tsx`):

- `/spreadsheet` -> `https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md`
- `/contributing` -> `https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md`
- `/education` -> `/projects?category=Sustainable+Development&subcategory=Education`
- `/grist_spreadsheet_metadata` -> `/methodology`
- `/how_to_identify_projects` -> `https://github.com/protontypes/open-sustainable-technology/blob/main/docs/how_to_identify_projects.md`
- `/meta_tags` -> `/`
- `/open_source_in_environmental_sustainability` -> `https://report.opensustain.tech/chapters/index.html`

Plus a client-side, non-stub redirect: `/#<old-heading-anchor>` (the old
mkdocs homepage rendered the README verbatim, so links like
`/#photovoltaics-and-solar-energy` pointed at a heading) is resolved at
runtime by `components/seo/legacy-anchor-redirect.tsx` +
`lib/seo/legacy-anchors.ts` into `/projects?category=...&subcategory=...`,
covering all 93 category/subcategory heading ids without 93 separate stub
pages.

Deliberately **not** stubbed (already resolve to real pages, same URL shape
old and new): `/analytics`, `/presentations`, `/privacy-policy`, and all 12
`/blog/<slug>/` URLs — mkdocs' Blog nav in the old `mkdocs.yml` produces the
exact same slugs with `use_directory_urls: true`, byte-for-byte including
mixed case (e.g. `introducing_openSustain_analytics`).

## Verification results

| Check | Result |
| --- | --- |
| build-typecheck | **Pass** — `pnpm typecheck` and `pnpm build` both clean, before and after this task's fixes |
| link-and-redirect-crawl | **Pass** — 0 broken internal links (re-crawled after fixes: 786 internal targets, 0 broken), all 7 redirect stubs and all 3 already-exists routes verified |
| content-parity | **Pass** — full parity on categories/subcategories/project count/blog/presentations/about; one pre-existing upstream README typo noted (see below), not a defect in this repo |
| design-consistency | **Failed, now fixed** — see "Fixes applied" below; all 4 findings were real and are now resolved. Re-verified in the built `out/` output after the fix (zero nested `<a>` tags site-wide; new CSS tokens compiled and referenced correctly; mobile padding rule present). |

No check still fails. The one caveat carried over from the original
design-consistency run: it was done via static source + built-HTML/CSS
analysis, not a live rendered-pixel pass in an actual browser (the review
agent's tools required a manual per-browser confirmation step it didn't
have). This task's fixes were verified the same way (source + built output),
plus a fresh full link/redirect crawl of the rebuilt `out/`. A live visual
check — especially tab order on the blog index and the community banner at
384-400px in an actual browser, both themes — is still worth doing before
launch, but nothing in this repo's tooling currently blocks it from being
done manually.

The content-parity check's one noted issue is not a defect in this repo: the
project "Macro" has `url: "ps://github.com/macroenergy/MacroEnergy.jl"`
(missing the `htt` prefix) in both `directory.json` and the upstream
`open-sustainable-technology/README.md` itself (line 544) — a pre-existing
typo in the source list, reproduced verbatim as this site's data contract
requires. Worth a PR against that README; out of scope for this repo.

## Fixes applied (design-consistency)

1. **Blog index nested `<a>` (real bug, fixed).** `app/blog/page.tsx` wrapped
   each post card in a `<Link>`, and `PostAuthors` rendered its own `<a>` per
   author inside that same wrapper — invalid HTML5, and confirmed in the
   built `out/blog/index.html` that browsers' parsing was splitting the
   outer link into duplicate tab-stops around each icon. Fixed by making the
   card wrapper a plain `<article>`, moving the whole-card click target onto
   the title's `<Link>` via a `::after` stretch (`inset: 0` over the
   `position: relative` card), and raising the author icon links above that
   overlay with `z-index`. Result: one tab-stop for "open this post" (the
   title) and one real, correctly-targeted tab-stop per author link — no
   duplicates, no invalid nesting. Verified in the rebuilt `out/`: max anchor
   nesting depth across the whole file is now 1 (was >1).
2. **About page `.todo` badge hardcoded colors (real bug, fixed).** Added
   `--color-warning` / `--color-warning-bg` tokens to `app/globals.css`
   (light + `[data-theme="dark"]`, matching every other token's pattern) and
   pointed `about.module.css` at them, removing the duplicated
   `[data-theme="dark"]` + `prefers-color-scheme` fallback blocks that
   restated the same two hex values.
3. **Presentations play-button overlay hardcoded colors (real bug, fixed —
   but not the way the review suggested).** The review suggested reusing
   `--color-black` via `color-mix()`. That would have been a *new* bug:
   `--color-black` is `#101620` in light mode but flips to `#f8fafc`
   (near-white) in dark mode — it's the theme's "ink" token. Using it for
   this scrim would turn the dark photo-thumbnail overlay near-white in dark
   mode, making the white play glyph unreadable against its own backdrop.
   Instead, added a new `--color-scrim` token to `globals.css` that is
   deliberately **not** redefined per theme (same documented rationale
   `globals.css` already uses for `--color-primary`, which also stays
   constant across themes) since this overlay sits on an arbitrary photo,
   not the page background. `presentations.css` now uses
   `color-mix(in srgb, var(--color-scrim) N%, transparent)` in all three
   spots (background, drop-shadow, circle fill) instead of literal
   `rgba(16, 22, 32, ...)`. The play glyph's `fill="#ffffff"` was left as a
   literal for the same reason (must stay white regardless of theme) and the
   file's header comment was updated to say so explicitly instead of
   claiming (inaccurately, as the review noted) that everything came from
   existing tokens.
4. **Community banner cramped at 400px (real, minor — fixed).** The banner's
   own code comment already said padding should shrink at the `768px`
   breakpoint to clear the close button, but no rule ever implemented it —
   side padding stayed a fixed `56px` at every width, leaving ~288px for the
   message at a 400px viewport (it wrapped rather than broke, so not a hard
   bug). Added the missing `<=768px` rule: padding drops to `44px` a side and
   the close button's offset drops to `0`, so the 44px WCAG-minimum tap
   target is still exactly cleared with less wasted gutter.

All four were spot-checked against the actual source/built output before
fixing (not just taken on the review's word), and `pnpm typecheck` +
`pnpm build` were re-run clean after every fix, plus a full internal
link/redirect re-crawl of the rebuilt `out/`.

## Remaining TODOs

**About page placeholders** (`lib/data/team.ts`, deliberately left as
explicit `null`/`[]` -> visible "TODO: ..." badges, never guessed at):

- Tobias — full name, role, avatar, links
- Salam — full name, role, avatar, links
- Andrew Nesbit — role, avatar, links (name already known in full)
- Chris Harris — role, avatar, links (name already known in full)
- Pierre — full name, role, avatar, links

Fill these in only from something one of these people (or `protontypes`,
the org behind `open-sustainable-technology`) confirms directly — see the
header comment in `lib/data/team.ts`.

**Secrets:**

- `GITHUB_TOKEN` — optional (see "How to run" above); recommended to add to
  `.github/workflows/deploy.yml`'s build step as
  `env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` so the `/about`
  contributors fetch doesn't share GitHub's 60/hour unauthenticated rate
  limit with other jobs on the runner's IP. Not required for a working
  build — it falls back to the committed snapshot.
- `OST_TECH_DISPATCH_TOKEN` — required only once the two sibling-repo
  patches below are applied: a fine-grained PAT with Contents: read/write on
  the new `opensustain.tech` repo, stored as a secret of this same name in
  **both** `open-sustainable-technology` and `opensustain.analytics` (not in
  `opensustain.tech` itself). See `docs/migration/README.md`.

**GitHub Pages settings** (manual, on the new repo, once it exists on
GitHub):

- Settings -> Pages -> Build and deployment -> Source = **GitHub Actions**
  (the committed `.github/workflows/deploy.yml` already targets this; the
  default "Deploy from a branch" source will not use it).
- Settings -> Pages -> Custom domain = `opensustain.tech` (the exported
  `out/CNAME` already contains this, but GitHub Pages' custom-domain
  verification/DNS-check step is a separate manual toggle per repo).
- "Enforce HTTPS" once the custom domain is verified.

## Manual cutover steps

Do these in order, as a human, outside of this session — nothing here has
been run automatically.

1. Create the `protontypes/opensustain.tech` remote on GitHub, then push
   this repo's `main` branch to it (`git remote add origin
   git@github.com:protontypes/opensustain.tech.git && git push -u origin
   main`). This repo currently has no `origin` configured.
2. In the new repo's Settings -> Pages, set **Source = GitHub Actions**
   (not "Deploy from a branch") so the committed `.github/workflows/deploy.yml`
   is what publishes it.
3. Still in Settings -> Pages, add custom domain `opensustain.tech` and let
   GitHub run its DNS check (the exported build already ships the matching
   `CNAME` file at the repo root of `out/`, i.e. `public/CNAME` in source).
4. Create the fine-grained `OST_TECH_DISPATCH_TOKEN` PAT (Contents:
   read/write, scoped to the new `opensustain.tech` repo) and add it as a
   secret of that exact name to **both**
   `/home/abdul-salam/Devv/protontypes/open-sustainable-technology` and
   `/home/abdul-salam/Devv/protontypes/opensustain.analytics` on GitHub
   (Settings -> Secrets and variables -> Actions in each). Required before
   the two patches below are useful (their new workflows fire a
   `repository_dispatch` using this token).
5. Review, then apply
   `docs/migration/0001-open-sustainable-technology-notify-and-retire-mkdocs.patch`
   to a checkout of `/home/abdul-salam/Devv/protontypes/open-sustainable-technology`
   (`git checkout -b notify-opensustain-tech && git apply
   /home/abdul-salam/Devv/protontypes/opensustain.tech/docs/migration/0001-open-sustainable-technology-notify-and-retire-mkdocs.patch`),
   then commit and open a PR. This deletes that repo's old `mkdocs gh-deploy`
   workflow (`publish.yml`) and adds a workflow that notifies
   `opensustain.tech` whenever `README.md` changes.
6. Review, then apply
   `docs/migration/0001-opensustain-analytics-publish-web-data.patch` to a
   checkout of `/home/abdul-salam/Devv/protontypes/opensustain.analytics`
   (`git checkout -b publish-web-data && git apply
   /home/abdul-salam/Devv/protontypes/opensustain.tech/docs/migration/0001-opensustain-analytics-publish-web-data.patch`),
   then commit and open a PR. This publishes `web/public/data/*.json` to a
   `data` branch and notifies `opensustain.tech` when it changes. Full
   rationale and exact commands for both patches: `docs/migration/README.md`.
7. Once both PRs are merged, update `opensustain.tech`'s
   `scripts/fetch-data.mjs` `ANALYTICS_DATA_REMOTE_BASE` placeholder to point
   at `https://raw.githubusercontent.com/protontypes/opensustain.analytics/data/`
   so the analytics JSON stops depending on a local sibling checkout in CI
   (currently falls back to the committed snapshot there instead, which
   still works but goes stale between manual refreshes).
8. Switch the `opensustain.tech` DNS/CNAME from the old mkdocs GitHub Pages
   deployment (currently serving from `open-sustainable-technology`'s Pages
   settings) to this new site: remove/disable the custom domain on the old
   repo's Settings -> Pages first (GitHub only lets one repo hold a given
   custom domain's verification at a time), then confirm it attaches
   cleanly on the new repo (step 3). No DNS record changes should be needed
   if the domain already points at GitHub Pages' servers, since both are
   GitHub Pages deployments — only the domain's repo association moves.
9. Confirm the old repo's `mkdocs gh-deploy` workflow (`publish.yml`) is
   actually gone/disabled after step 5's PR merges, so it can't re-deploy the
   retired docs site on a future push to that repo's `main`.
10. Spot-check the live site once DNS has propagated: homepage, `/projects`,
    a couple of the 7 redirect stubs, and a `/#<old-anchor>` link, to confirm
    the cutover is complete end-to-end.
