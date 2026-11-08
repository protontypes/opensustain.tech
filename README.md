# opensustain.tech

The Next.js site for [OpenSustain.Tech](https://opensustain.tech): a
directory and analysis of the open-source ecosystem in climate change,
sustainable energy, biodiversity and natural resources. Statically exported;
no server, no API routes.

The project list itself lives in
[open-sustainable-technology](https://github.com/protontypes/open-sustainable-technology)'s
`README.md`. Contributors send PRs there; this site reads it at build time.

## Develop

Requires Node.js 18.18+ and pnpm.

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build        # runs scripts/fetch-data.mjs, then next build into out/
pnpm fetch-data   # refresh public/data/*.json on its own
```

## Routes

| Path | What it is |
| --- | --- |
| `/` | Homepage and the ecosystem ring |
| `/projects` | Every listed project, searchable |
| `/education` | Learning resources from `education.md` |
| `/analytics` | Overview, linking to the dashboards below |
| `/analytics/projects` | Rankings, lifecycle and attribute charts |
| `/organizations` | Who maintains the projects, and where |
| `/topics` | Keyword and topic analysis |
| `/methodology` | Where the data comes from and its limits |
| `/blog`, `/blog/[slug]`, `/blog/talks` | Articles and talks |
| `/about` | Team and GitHub contributors |

Routes are registered in `lib/navigation.ts`.

## Data

`scripts/fetch-data.mjs` builds everything in `public/data/` (gitignored)
from three sources:

- **OST `README.md` and `education.md`**: which projects exist and how they
  are grouped; learning resources, separately.
- **opensustain.analytics `data/projects.csv`**: per-project metrics from
  ecosyste.ms, joined to README entries by URL, then by name.
- **opensustain.analytics `data` branch**: the analytics payloads.

Each source falls back to a sibling checkout, then to the committed snapshot
in `public/data/fallback/`, so the build works offline.

**Counts.** Every number a page shows comes from `site-totals.json`, read
through `loadSiteTotals()`:

- `projects`: everything the README lists. This is the headline.
- `projects_with_metrics`, `active_projects`: the subset ecosyste.ms tracks,
  and of those, the ones with a commit in the past year.
- `learning_resources`: `education.md`, counted on its own. Courses and books
  are not projects; the analytics pipeline drops ecosyste.ms's "Education"
  subcategory for the same reason.

The ring holds exactly the directory's projects, so the ring, the home page,
`/projects` and `/analytics` agree by construction. Listed projects that
ecosyste.ms doesn't track appear with `tracked: false` and no metrics. When
the pipeline's count and `projects_with_metrics` drift apart, `fetch-data`
warns: that's usually a renamed repository, and the fix is the README link.

## How updates reach the site

```
OST README.md changes ── ost-readme-updated ──┬─> this repo rebuilds
                                              └─> opensustain.analytics
                                                  update_data.yml (also daily)
                                                  └─ publish-payloads.yml
                                                     └─ analytics-data-updated ─> this repo rebuilds
```

Plus a weekly scheduled rebuild. The dispatches need the
`OST_TECH_DISPATCH_TOKEN` secret (a fine-grained PAT, Contents: read and
write on `opensustain.tech` and `opensustain.analytics`) in both
`open-sustainable-technology` and `opensustain.analytics`. **It expires.** An
expired token fails silently and the site falls back to its weekly rebuild,
so rotate it before then.

New projects show on `/projects` within minutes but get metrics only once
ecosyste.ms has crawled them, usually by the next daily run.

## Still to do

`opensustain.tech` is still served by the old mkdocs site; this one deploys
to `protontypes.github.io/opensustain.tech`. Moving the domain:
[#2](https://github.com/protontypes/opensustain.tech/issues/2). Open work is
tracked in [issues](https://github.com/protontypes/opensustain.tech/issues).
