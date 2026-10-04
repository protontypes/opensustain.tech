# Keeping the site in step with its two sibling repos

This repo's deploy pipeline (`.github/workflows/deploy.yml`) rebuilds on a
`repository_dispatch` from
[`open-sustainable-technology`](https://github.com/protontypes/open-sustainable-technology)
(OST) and [`opensustain.analytics`](https://github.com/protontypes/opensustain.analytics),
plus a weekly cron as a safety net. This page is how those two repos are wired
to send it.

## The flow after a project PR is merged

```
OST: PR merged, README.md changes on main
 └─ notify-downstream.yml ── ost-readme-updated ──┬─> opensustain.tech: deploy.yml
                                                  │     (directory shows the new
                                                  │      project, no metrics yet)
                                                  └─> opensustain.analytics:
                                                        update_data.yml
                                                         rebuilds data/*.csv with OST's
                                                         release_dataset.py --csv-only
                                                        └─ publish-payloads.yml
                                                            publishes the `data` branch
                                                            └─ analytics-data-updated
                                                                └─> opensustain.tech:
                                                                    deploy.yml
```

`update_data.yml` also runs daily. The metrics come from ost.ecosyste.ms,
which picks up newly listed projects on its own schedule, so a run straight
after a merge often doesn't have the new project yet; the daily run catches
it once ecosyste.ms does. Until then the project still appears on
`/projects`, sourced from the README alone (see `../../DATA_CONTRACT.md`).

OST's monthly `release_dataset_action.yml` (Grist sync and the dataset
release) is unchanged and no longer feeds the site.

## Where the pieces live

- **OST** — `.github/workflows/notify-downstream.yml` sends
  `ost-readme-updated` to both repos when `README.md` changes on `main`.
  `.github/workflows/release_dataset.py --csv-only` writes the two CSVs and
  skips the Grist upload.
- **opensustain.analytics** — `update_data.yml` checks out OST, runs that
  script, and commits `data/*.csv`. `publish-payloads.yml` runs after it,
  builds the 13 payloads with `scripts/build_analytics_payloads.py`, pushes
  them to the `data` branch with
  [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages),
  and sends `analytics-data-updated` here.
- **This repo** — `scripts/fetch-data.mjs` reads the payloads from
  `https://raw.githubusercontent.com/protontypes/opensustain.analytics/data`,
  the CSVs from that repo's `main`, and the README from OST's `main`.

## The dispatch token

`repository_dispatch` needs a token with write access to the *target* repo;
the default `GITHUB_TOKEN` only reaches the repo its workflow runs in. Both
senders skip their dispatch step when the secret is missing, so nothing
fails before it exists, but nothing is sent either.

1. Create a fine-grained personal access token with **protontypes** as the
   resource owner, scoped to `opensustain.tech` and `opensustain.analytics`,
   with **Contents: read and write** (what `repository_dispatch` checks).
   The org may need to allow or approve fine-grained tokens first
   (org Settings → Personal access tokens).
2. Add it as a secret named `OST_TECH_DISPATCH_TOKEN` in both
   `open-sustainable-technology` and `opensustain.analytics` (repo Settings →
   Secrets and variables → Actions).

Fine-grained tokens expire; note the date and rotate it before then, or the
dispatches stop silently and the site falls back to its weekly rebuild.

## Not done yet: retiring mkdocs

OST's `.github/workflows/publish.yml` still builds the old mkdocs site and
deploys it to `opensustain.tech` (`docs/CNAME`). Leave it until this repo
takes over the custom domain; then delete it in OST and point the domain
here.
