# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people looking for an open-source tool for a sustainability problem. Researchers, modellers and developers who arrive with a question ("is there an open solar forecasting library?", "what models the grid?") and need to find, compare and judge projects quickly.

Secondary, served in later layers: contributors who add or correct projects in the list or pick up issues (via ClimateTriage), and funders or policy readers who want the shape and health of the ecosystem (via Analytics).

## Product Purpose

OpenSustain.Tech is the website for the Open Sustainable Technology list: a curated map of the open-source projects working on climate change, sustainable energy, biodiversity and natural resources. It makes that list searchable, browsable by category, and measurable with project metrics. Success is a visitor finding a project that fits their problem, and judging from the metrics whether it is alive and usable.

## Positioning

The list is curated by people and maintained in the open on GitHub (protontypes/open-sustainable-technology `README.md`), where anyone can add or correct a project with a pull request. The site pairs that human curation with measured activity from ecosyste.ms, so every entry shows both why it belongs and how healthy it is.

## Operating Context

- Static Next.js export deployed to protontypes.github.io/opensustain.tech; the domain move to opensustain.tech is pending (opensustain.tech issue #2).
- Data is rebuilt by a dispatch chain: OST README change → opensustain.analytics refresh → payloads → site rebuild, plus a weekly scheduled rebuild.
- `scripts/fetch-data.mjs` writes `public/data/*.json`; `writeSiteTotals()` is the single source for every count on the site.
- Routes: home, project directory (`/projects`), learning resources (`/education`), analytics (projects, organizations, topics), articles and talks, about, methodology, contributing.

## Capabilities and Constraints

- Directory: full-text search (`/projects?q=`), category and subcategory filters, a project dialog with metrics.
- Ecosystem sunburst: 13 categories → 80 subcategories → projects; the ring centre reads "The Open Source Ecosystem in Sustainability" and counts all projects, including inactive ones. A plain list alternative must stay reachable.
- The headline total is every project the README lists.
- Learning resources have their own page and count and are never counted as projects.
- Light and dark themes exist today.

## Brand Commitments

- Names: "Open Sustainable Technology" (the list and site title) and "OpenSustain.Tech" (the site wordmark).
- Existing arc logo mark.
- Content licensed CC BY 4.0; project metrics credited to ecosyste.ms.
- Community project: Discord, Mastodon, LinkedIn, Bluesky.

## Evidence on Hand

- Totals as of 8 November 2026 (`public/data/site-totals.json`): 2,762 projects, 2,704 with metrics, 1,923 active in the past year, 1,355 organizations, 55,360 contributors, 13 categories, 80 subcategories, 127 learning resources in 11 topics.
- Per-project records with description, language, license, stars, contributors, commits, downloads, last commit, homepage, owner avatar and keywords (`public/data/directory.json`).
- Category colours already defined in `public/data/ecosystem-sunburst.json`.
- No testimonials, user counts or funder logos exist; none may be invented.

## Product Principles

1. Finding a tool comes first: search and browse are never more than one step away.
2. Every number traces to the data snapshot and says when it was read.
3. Curation and measurement sit side by side; neither is presented as the other.
4. Open by default: show how to add, correct or contribute wherever a visitor might notice a gap.

## Accessibility & Inclusion

- Keyboard and screen-reader access: skip link, visible focus, and a list alternative to every chart that needs a pointer.
- WCAG 2.1 AA contrast in both themes.
