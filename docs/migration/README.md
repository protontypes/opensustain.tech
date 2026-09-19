# Migration patches for the two sibling repos

These are **proposed, unapplied** changes to
[`open-sustainable-technology`](https://github.com/protontypes/open-sustainable-technology)
and [`opensustain.analytics`](https://github.com/protontypes/opensustain.analytics)
that complete this repo's deploy pipeline (`.github/workflows/deploy.yml`).
Nothing here has been committed to either repo — each `.patch` file was
generated against that repo's current `main` and verified with
`git apply --check` (see the command below), but applying it for real is a
decision for whoever maintains that repo.

Both assume the new site lives at `github.com/protontypes/opensustain.tech`.
That repo has no `origin` remote configured yet at the time these patches
were written — if it ends up somewhere else, replace
`protontypes/opensustain.tech` in both patches and in
`.github/workflows/deploy.yml`'s comments accordingly.

## One prerequisite for both patches: a dispatch token

`repository_dispatch` needs a token with write access to the *target* repo
(`opensustain.tech`); the default `GITHUB_TOKEN` a workflow runs with only
has access to the repo it's running in. Once `opensustain.tech` exists on
GitHub:

1. Create a fine-grained personal access token scoped to just that repo,
   with **Contents: read and write** permission (this is what
   `repository_dispatch` checks).
2. Add it as a secret named `OST_TECH_DISPATCH_TOKEN` in **both**
   `open-sustainable-technology` and `opensustain.analytics` (repo Settings →
   Secrets and variables → Actions).

## `0001-open-sustainable-technology-notify-and-retire-mkdocs.patch`

Applies to `open-sustainable-technology`:

- **Deletes** `.github/workflows/publish.yml` — the `mkdocs gh-deploy` job
  that built and published the old docs site. `opensustain.tech`'s own
  `deploy.yml` is what publishes the site now; this dashboard app already
  fetches this repo's `README.md` and `data/*.csv` at build time (see
  `../../DATA_CONTRACT.md`), so nothing in the pipeline still needs mkdocs to
  run. Left running, it would keep re-deploying the retired docs site
  alongside the new one on every push to `main`.
- **Adds** `.github/workflows/notify-opensustain-tech.yml` — fires a
  `repository_dispatch` (`event_type: ost-readme-updated`) to
  `opensustain.tech` whenever `README.md` changes on `main`, so a merged
  project PR shows up in the directory within minutes rather than waiting for
  `deploy.yml`'s weekly cron.

Apply from a checkout of `open-sustainable-technology`:

```sh
git checkout -b notify-opensustain-tech
git apply /path/to/opensustain.tech/docs/migration/0001-open-sustainable-technology-notify-and-retire-mkdocs.patch
git add -A
git commit -m "ci: notify opensustain.tech on README changes; retire mkdocs gh-deploy"
```

## `opensustain.analytics`: committed to `main`, not a patch

The analytics payloads used to be committed under `web/public/data/` of the
Next.js app that lived in that repo. With the app moved here, upstream had
neither the app nor the builder, so rather than a patch the builder and its
workflow are committed directly to `opensustain.analytics`' `main`:

- `scripts/build_analytics_payloads.py` — builds the 13 JSON payloads from
  `data/*.csv`, now into `data/payloads/` (gitignored) by default.
- `make build-json` — runs it.
- `.github/workflows/publish-payloads.yml` — after the existing
  "Update OpenSustain Data" workflow refreshes the CSVs (and on pushes that
  change the CSVs or the builder, and on demand), builds the payloads and
  publishes them to a dedicated `data` branch with
  [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages),
  then fires a `repository_dispatch` (`event_type: analytics-data-updated`)
  to `opensustain.tech`. The dispatch is skipped if
  `OST_TECH_DISPATCH_TOKEN` is not set.

This is live: the workflow publishes to the `data` branch, and
`scripts/fetch-data.mjs` reads the payloads from
`https://raw.githubusercontent.com/protontypes/opensustain.analytics/data`
and the CSVs from that repo's `main`. A sibling checkout's `data/payloads/`
(`make build-json`) is the fallback when those are unreachable, and the
committed snapshot the last resort.

## How these were generated and checked

Each patch is a hand-assembled unified diff (`diff --git a/... b/...` /
`--- ` / `+++ ` / `@@` hunks, in the same shape `git format-patch` produces)
built from that repo's real current file content, not typed freeform — the
deleted file's hunk came from `diff -u open-sustainable-technology/.github/
workflows/publish.yml /dev/null`, and each added file's hunk from `diff -u
/dev/null <new file>`, with git-style headers added around them. Both were
verified with `git apply --check --stat <patch>` against a real checkout of
the target repo (dry run — nothing was written; `open-sustainable-technology`
and `opensustain.analytics` are untouched) before being placed here.
