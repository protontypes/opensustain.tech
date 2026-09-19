# TODO — retiring the Streamlit dashboard

Working list for bringing the Next.js app in `web/` to full parity with
`streamlit-app-tab.py`, then past it.

All nine Streamlit tabs have a Next.js equivalent, the organisation views filter
by country and type, and every chart exports. What follows came out of two
audits: a seven-dimension parity audit against `tabs/*.py` (42 confirmed
findings, 3 refuted) and a research pass over comparable analytics products
(40 patterns from Our World in Data, Climate TRACE, ecosyste.ms, OSS Insight,
deps.dev, GitHub Innovation Graph, Datawrapper, Linear, Metabase and others).

Ordered by impact. P0 is broken behaviour, P1 is what the product is missing
that its audience needs, P2 is the larger structural work.

---

## P0 — broken now

- [x] **Ecosystem search always says "Nothing matches"** at the root, which is
      the home page's default state. `matchCount` counts arcs with
      `item.visible`, but the chart draws two rings at a time so every project
      is parked invisible at the root — the count is structurally 0 while the
      ring correctly dims to the matches. Same `visible`-is-not-data confusion
      already fixed for CSV export. `ecosystem-sunburst.tsx:176`
- [x] **"All 1,274 organizations" paints nothing.** `HorizontalBarChart` sizes
      its canvas from the row count with no ceiling: 33,188px, past Firefox's
      32,767px limit and past Chrome's at dpr 2. `horizontal-bar-chart.tsx:169`
- [x] **Projects Over Time keeps a hardcoded 210px axis gutter** after every
      sibling moved to a measured one, so on a 360px phone the plot area is
      122px wide. It also truncates 32 of the 81 sub-category names on desktop
      with no recovery path. `projects-over-time-chart.tsx:122`
- [x] **Rankings y-axis labels are clipped off-canvas below ~530px** — the
      label width is a fixed 180px inside a gutter that shrinks with the
      container. `project-rankings-chart.tsx:150`
- [x] **Keyword chart reads "All 300 keywords" while drawing 30.** `TopNField`
      discards a caller default that falls *between* its fixed choices; the
      earlier fix only handled a default above every option.
      `top-n-field.tsx:28`
- [x] **Organisation sunburst goes blank** when a page filter empties the
      organisation you had zoomed into: the focus falls back to the root only
      when the id is missing, never when the node is emptied, and its memo
      never invalidates on a filter change. `organization-sunburst.tsx:145`
- [x] **Its tooltip promises "Click to select"** but a plain click navigates
      off-site, and a double-click opens the repository three times.
      `org-tree.ts:78`, `sunburst-svg.tsx:301`
- [x] **Sub-category sunburst announces every wedge as "N projects"** to a
      screen reader; its leaves are organisations. `sunburst-svg.tsx:465`
- [x] **Ecosystem hole keeps saying "13 categories"** after the legend isolates
      a subset — the project count follows the filter, the category count reads
      the raw child array. `ecosystem-sunburst.tsx:394`
- [x] **Heatmap top-N reads "All 0 topics"** for the whole 820 KB load — the
      toolbar renders above the loading guard. `topics-heatmap-chart.tsx:188`
- [x] **Organisation sunburst hardcodes 276** as its "all" ceiling and the
      "two or more projects" threshold is prose, while `minimum_project_count`
      and the real count are both in the payload.
      `organization-sunburst.tsx:48`, `organizations/page.tsx:54`
- [x] **The type filter cannot select the "Unknown" bar it draws** (101
      organisations), and the country filter cannot select "Not recorded" (102).
      `organization-filters.tsx:81`
- [x] **The countries note names two of three non-country buckets** — Europe is
      drawn and unaccounted for. `organizations-distribution-charts.tsx:218`

## P1 — what the product is missing

Where both audits agreed, the parity finding and the researched pattern are
noted together.

- [x] **Nothing on the site says how old the data is.** Every payload carries
      `generated_at`, `summary.json` also carries `as_of`, and neither reaches a
      page; the footer's year comes from the visitor's clock. A May snapshot
      renders as September. *Parity + research (Climate TRACE masthead, GitHub
      Innovation Graph "last updated").* Render the scope line and the date in
      the hero, and the date in the footer, formatted once server-side
- [x] **The provenance block is gone.** No CC-BY 4.0 attribution — which the
      licence requires — no Ecosyste.ms credit, no dataset links.
      `streamlit-app-tab.py:154`
- [x] **Sparse metrics are plotted as zero.** Citations are non-zero for 321 of
      2,691 projects and downloads for 867, so ranking by citations draws 18
      empty bars out of 25 and a zero-citation bubble is indistinguishable from
      a real 1. *Research: PageSpeed "not enough data", Innovation Graph's
      published suppression rule.* Add `lib/charts/coverage.ts`, a coverage note
      above any chart under 50%, and suppress zero rows rather than drawing them
      — the sunburst colour bar already does this correctly via `bins.zeros`
- [x] **Nine ranking metrics are offered with no definition.**
      `total_score_combined` is the default on two routes and is a 0–6 sum of
      six normalised metrics, which reads as a rating out of 5. DDS appears as a
      bare median with no scale or direction. `streamlit-app-tab.py:101`
- [x] **`Panel` has no notes or source slot.** *Research: Datawrapper's
      title/description/notes/source block, OWID's chart footer.* Add both, then
      put each chart's real caveat in it — the ecosystems over-count, "projects
      carry no country, this is the organisation's", the sparsity notes
- [x] **Tooltips drop most of what the payload holds.** Rankings shows 4 of 8
      metrics and no description; the scatter drops the description and five
      metrics; `organization_description` is emitted in three payloads and read
      in none; `avatar_url` is typed and never rendered
- [x] **Top-N ceilings are below Streamlit's and ignore the payload.** Projects
      cap at 100 where Streamlit reaches 300 and defaults to 50; organisations
      cap at 100 of 1,274 with a default of 60; distributions default 25 vs 30.
      Four controls hardcode a 25 the pipeline already specifies
- [x] **Bubble size saturates at 28px**, so 60% of points are the same dot for
      Total Commits. Normalise against the filtered set as Plotly does
- [x] **The filter bar is not sticky** on a ~5,000px page, so a filter governs
      charts far below with no on-screen reason and no control in reach
- [x] **The two organisation sunbursts have no search**, though the highlight
      machinery is wired in and passed `null`
- [x] **The age axis sits at the bottom of a ~1,700px chart.** Streamlit moved
      it to the top for exactly this reason
- [x] Heatmap legend prints raw log10 values with no label; invert it to counts
- [x] Ecosystem project ring keeps payload order when the colour metric changes,
      so it reads high-to-low only for the default metric

## P2 — structural

- [x] **No chart state is in the URL**, so no view can be linked, shared, or
      reached with Back, and nothing can deep-link into `/projects` with a
      category preselected. *Parity + research (Linear, OWID Grapher,
      landscape2).* A `useViewParams` hook over `useSearchParams`; `ViewState`
      is already a flat serialisable record
- [ ] **A table twin on every chart.** *Research: OWID's Chart/Map/Table tabs.*
      Nearly free — `useChartExport` already builds the rows on screen
- [x] **A `/methodology` route** stating the limitations before a reader finds
      them. *Research: Innovation Graph's datasheet, OWID's "what you should
      know".* The three known data defects belong here
- [ ] **Facet counts on every filter option, and no option that leads to an
      empty chart.** *Research: ClimateTriage's own counted browse rail —
      this repo's named design reference — plus Algolia facet counts*
- [ ] **Show the arithmetic behind Total Score.** *Research: Libraries.io
      SourceRank's signed contribution list, OpenSSF Scorecard's disclosed
      weights.* Two metrics carry 94% of it
- [ ] **A project detail route at `/projects/[slug]`** — the missing third
      level. Every chart dead-ends at an external repository link
- [ ] **Drill-through on click** instead of one guessed meaning per chart
- [ ] Verb-first entry cards on the home page, replacing the three noun cards

---

## `ecosystems` is miscounted upstream — needs a decision

Found while building C. Two artefacts in `project-attributes.json`
`fields.ecosystems`, both from `data/projects.csv`:

- **Every non-empty value ends with a trailing comma** (2,219 of 2,800 rows),
  so the split in `build_analytics_payloads.py:643` yields an empty final
  element that is counted as "Unknown" — exactly 2,691 of them, one per
  project. The web chart drops that bucket and says so; Streamlit draws it.
- **A registry is listed once per package, not once per project**
  (`actions, actions, actions, pypi,`), so 8,674 of the 12,576 real entries
  across 1,687 projects are repeats. "actions: 4,766" is not 4,766 projects.
  The chart labels the axis "Entries" rather than pretending otherwise.

- [ ] **Decide:** stripping empty segments and de-duplicating per project is a
      two-line change in `build_analytics_payloads.py`, but that file is
      regenerated by the `update_data` workflow, so it is the same deliberate
      call as the country join below. Until then both frontends overstate it

---

---

## Production blockers

Independent of feature parity. None of these are about the charts.

- [ ] **There is no deploy path for the Next.js app.** `Dockerfile` is
      `python:3.13-slim` running `streamlit run`, and `deploy-package.yaml`
      ships only that image. `.gitignore` already lists `web/out/`, so a
      static export looks like the original intent — `next.config.ts` has no
      `output` mode set
- [ ] **No CI touches the web app.** Four workflows, none run npm.
      Add a typecheck + build gate; it would have caught the type error the
      old sunburst shipped with
- [ ] **No error boundaries.** `app/` has no `error.tsx` or
      `global-error.tsx`, so any render-time throw replaces the page with
      Next's exception screen
- [ ] **No tests.** No test tooling in the repo at all
- [ ] **Every route shares one title.** Metadata is defined only in
      `layout.tsx`; all four routes present as "OpenSustain Analytics"
- [ ] **Next 15.5.2 advisory.** pnpm flags CVE-2025-66478 on the pinned
      version
- [ ] **`web/tsconfig.tsbuildinfo` is tracked** and churns on every
      typecheck; it belongs in `.gitignore`
- [ ] Update `README.md` — it does not mention the web app at all

---

## Done

- [x] Ecosystem Overview — `/` (tab 1), rebuilt on D3 with search, export and
      a details panel Streamlit has no equivalent for
- [x] Project Rankings — `/projects` (tab 2), all four Streamlit controls
- [x] Organisation Rankings — `/organizations` (tab 3), category filter ranks
      by that category's score as Streamlit does
- [x] Projects over Time — `/projects` (tab 4), category + bubble-size
- [x] Projects by Organisation — `/organizations` (tab 6), drill-down sunburst
- [x] Topics & Keywords — `/topics` (tab 9), both sliders
- [x] Removed every payload from the RSC stream:
      `/` 5,053,147 → 34,164 B · `/projects` 3,185,936 → 22,760 B ·
      `/organizations` 725,193 → 23,014 B · `/topics` 218,335 → 27,934 B
- [x] Mobile navigation — below 768px the nav was `display:none` with nothing
      in its place, so three routes were unreachable on a phone
- [x] **D.** Discord — `discord.gg/JDUatGKxve` in a dismissible strip above the
      header, matching ClimateTriage's own band. It sat in the nav bar first,
      which crowded four routes, a repository link and the theme toggle into
      one row. Dismissal persists in localStorage and is applied by the inline
      script in `layout.tsx`, so a closed bar never flashes and an open one
      never shifts the page
- [x] **E.** Export on every chart — 19 of 19, against one before. PNG and CSV
      everywhere, plus SVG on the three sunbursts, which are already vector.
      The CSV is the rows on screen, so a top-25 filtered view exports 25 rows,
      and filenames carry the view: metric, category, top-N and active filters
- [x] **Country and organisation-type filters** — one bar at the top of
      `/organizations` driving all seven charts, where Streamlit repeats the
      pair on each of its four organisation tabs. Options are the payload's own
      43 ISO-coded buckets, not the raw column, which offers "Berlin", "German"
      and "Frace" beside "Germany". `lib/charts/organization-geography.ts`
      redoes the pipeline's `country_converter` join in the browser and
      `verifyGeography` checks the reconstruction against the payload's own
      totals on load in development
- [x] **C.** Projects Attributes — closes tab 8. Seven distribution charts
      (commit activity, code of conduct, contributing guide, languages,
      licenses, package ecosystems, git platforms) replacing three lists cut
      at eight rows. Reuses `HorizontalBarChart` and the shared payload cache
- [x] **A.** Organisations tab — closes tab 5. A projects-per-country
      choropleth plus four bar charts, replacing two lists cut at eight rows.
      `scripts/build-world-map.mjs` vendors the geometry ECharts does not ship;
      `HorizontalBarChart` backs all four bars; `useAnalyticsPayload` means the
      five charts share one fetch of the 527 KB payload
- [x] **B.** Organisations by Sub-Category sunburst — closes tab 7. All 81
      sub-categories in one ring, coloured by their parent ecosystem category,
      opening to the organisations behind each; country and organisation-type
      filters; replaces the 8-item list. Shares `SunburstSvg`, the geometry and
      the tween with the other two charts, via `lib/sunburst/subcategory-tree.ts`
