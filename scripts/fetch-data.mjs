#!/usr/bin/env node
/**
 * Pulls every build-time data source this site reads and writes them into
 * public/data/. Run automatically before `next build` (see the "build"
 * script in package.json) and available on its own as `pnpm fetch-data`.
 *
 * Three things are fetched, each with the same three-tier fallback —
 * (1) a remote source, (2) a local sibling checkout on this machine, (3) the
 * small snapshot committed in this repo — so the build never hard-fails for
 * lack of network or a sibling clone:
 *
 *   1. The 13 analytics JSON payloads (summary, filters, rankings, the
 *      sunburst tree, etc.) that opensustain.analytics' Python pipeline
 *      (scripts/build_analytics_payloads.py) builds from data/projects.csv
 *      and data/organizations.csv. That repo's publish-payloads workflow
 *      pushes them to its `data` branch after every CSV update, which is the
 *      remote tier (ANALYTICS_DATA_REMOTE_BASE). The sibling-checkout tier
 *      reads data/payloads/, where `make build-json` writes them locally.
 *
 *   2. data/projects.csv and data/organizations.csv from that same repo's
 *      main branch — the raw project/organization records, richer than the
 *      README's plain links (stars, language, license, activity, contributor
 *      counts, ...). Same fallback tiers.
 *
 *   3. open-sustainable-technology/README.md — the ~2,767-entry awesome list
 *      that is the actual source of truth for which projects exist and how
 *      they're grouped (## category / ### subcategory). This one DOES have a
 *      real remote today (OST_README_REMOTE_URL, raw.githubusercontent.com
 *      on the main branch), so step 3 usually succeeds over the network even
 *      in CI with no sibling checkout present.
 *
 * Sources (1)+(2)+(3) are then joined into public/data/directory.json — see
 * DATA_CONTRACT.md for the exact shape and the match statistics behind this
 * decision. CSV is the primary source (it matched 97.3% of README entries
 * with every one of category/sub_category/url/description present); the
 * ~2.7% of README entries with no CSV row (recently-added, or hosted
 * somewhere the analytics crawler doesn't cover) are still included, sourced
 * from the README alone with metrics fields left null and `source: "readme"`.
 *
 * Committing the full output as tracked, churn-prone data is exactly what
 * this pipeline exists to avoid — the 13 payloads alone are ~10 MB and
 * regenerate on a schedule upstream, and directory.json is rebuilt from them
 * every run. So public/data/*.json (direct children only) is .gitignore'd,
 * and a small trimmed snapshot of each is committed under public/data/
 * fallback/ instead — see the .gitignore comment next to that pattern. This
 * script's own last-resort tier copies those fallback files into place, so
 * `pnpm build` still produces a real site with representative (if partial)
 * data with no network and no sibling checkouts at all.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseCsv } from "csv-parse/sync";

// ---------------------------------------------------------------------------
// Configuration — the only things to change once real remotes exist.
// ---------------------------------------------------------------------------

/**
 * The 13 analytics payloads, as opensustain.analytics' publish-payloads
 * workflow pushes them to its `data` branch after every CSV update. Each file
 * is fetched as `${ANALYTICS_DATA_REMOTE_BASE}/${filename}`. Set to null to
 * build from a sibling checkout's data/payloads/ (`make build-json`) instead.
 */
const ANALYTICS_DATA_REMOTE_BASE =
  "https://raw.githubusercontent.com/protontypes/opensustain.analytics/data";

/**
 * The raw project/organization CSVs the payloads are built from
 * (`${ANALYTICS_DATA_CSV_REMOTE_BASE}/projects.csv`, `/organizations.csv`),
 * on opensustain.analytics' main branch, where the update bot commits them.
 */
const ANALYTICS_DATA_CSV_REMOTE_BASE =
  "https://raw.githubusercontent.com/protontypes/opensustain.analytics/main/data";

/** The OST README does have a real remote today. */
const OST_README_REMOTE_URL =
  "https://raw.githubusercontent.com/protontypes/open-sustainable-technology/main/README.md";

/**
 * Sibling checkouts on the machine this was written on. Real, working local
 * fallback for local development; simply absent (and skipped) on any other
 * machine or in CI, where the committed public/data/fallback/ snapshot is
 * what carries the build.
 */
const ANALYTICS_REPO_LOCAL_PATH =
  process.env.OST_ANALYTICS_REPO_PATH ??
  path.resolve(repoRoot(), "../opensustain.analytics");
const OST_README_REPO_LOCAL_PATH =
  process.env.OST_README_REPO_PATH ??
  path.resolve(repoRoot(), "../open-sustainable-technology");

const ANALYTICS_PAYLOAD_FILES = [
  "summary.json",
  "filters.json",
  "ecosystem-sunburst.json",
  "project-rankings.json",
  "projects-over-time.json",
  "project-attributes.json",
  "organizations-overview.json",
  "organization-rankings.json",
  "projects-by-organization.json",
  "organizations-by-subcategory.json",
  "keyword-counts.json",
  "topics-heatmap.json",
  "wordcloud.json",
];

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

const ROOT = repoRoot();
const DATA_DIR = path.join(ROOT, "public", "data");
const FALLBACK_DIR = path.join(DATA_DIR, "fallback");

// ---------------------------------------------------------------------------
// Small fetch helpers — each returns text or null, never throws.
// ---------------------------------------------------------------------------

async function fetchText(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function readLocal(filePath) {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Resolve one source through the three tiers, logging which one won. */
async function resolve(label, { remoteUrl, localPath, fallbackPath }) {
  const remote = await fetchText(remoteUrl);
  if (remote !== null) {
    console.log(`[fetch-data] ${label}: remote (${remoteUrl})`);
    return remote;
  }
  const local = localPath ? await readLocal(localPath) : null;
  if (local !== null) {
    console.log(`[fetch-data] ${label}: local sibling checkout (${localPath})`);
    return local;
  }
  const fallback = fallbackPath ? await readLocal(fallbackPath) : null;
  if (fallback !== null) {
    console.log(`[fetch-data] ${label}: committed fallback snapshot (${fallbackPath})`);
    return fallback;
  }
  console.warn(`[fetch-data] ${label}: no source available (remote, local, and fallback all missing)`);
  return null;
}

// ---------------------------------------------------------------------------
// 1. Analytics JSON payloads → public/data/*.json
// ---------------------------------------------------------------------------

async function fetchAnalyticsPayloads() {
  await mkdir(DATA_DIR, { recursive: true });
  for (const file of ANALYTICS_PAYLOAD_FILES) {
    const remoteUrl = ANALYTICS_DATA_REMOTE_BASE ? `${ANALYTICS_DATA_REMOTE_BASE}/${file}` : null;
    const localPath = path.join(ANALYTICS_REPO_LOCAL_PATH, "data", "payloads", file);
    const fallbackPath = path.join(FALLBACK_DIR, file);
    const text = await resolve(file, { remoteUrl, localPath, fallbackPath });
    if (text === null) continue;
    await writeFile(path.join(DATA_DIR, file), text, "utf-8");
  }
}

// ---------------------------------------------------------------------------
// 2 + 3. README + CSVs → public/data/directory.json
// ---------------------------------------------------------------------------

function normalizeUrl(url) {
  if (!url) return "";
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\.git$/i, "")
    .toLowerCase();
}

function normalizeName(name) {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Parses the README's `## Category` / `### Subcategory` / `- [name](url) -
 * description` structure into an ordered list of entries. Only sections
 * after the "Contents" ToC are read, in source order, so category and
 * subcategory order in the output matches the README exactly.
 */
function parseReadmeEntries(readmeText) {
  const lines = readmeText.split(/\r?\n/);
  const linkLine = /^\s*[-*]\s*\[([^\]]+)\]\(([^)]+)\)\s*-?\s*(.*)$/;
  const entries = [];
  let category = null;
  let subcategory = null;
  let inContents = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      if (heading.toLowerCase() === "contents") {
        inContents = true;
        category = null;
        continue;
      }
      inContents = false;
      category = heading;
      subcategory = null;
      continue;
    }
    if (line.startsWith("### ")) {
      if (inContents) continue;
      subcategory = line.slice(4).trim();
      continue;
    }
    if (inContents || category === null) continue;
    const match = linkLine.exec(line);
    if (!match) continue;
    const [, name, url, description] = match;
    entries.push({
      category,
      subcategory,
      name: name.trim(),
      url: url.trim(),
      readmeDescription: description.trim(),
    });
  }
  return entries;
}

function parseCsvRows(csvText) {
  return parseCsv(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
}

const CSV_METRIC_FIELDS = [
  "stars",
  "language",
  "license",
  "contributors",
  "total_commits",
  "downloads_last_month",
  "score",
  "platform",
  "latest_commit_activity",
  "project_created_at",
  // The project's own site, separate from whichever link the README happens
  // to point at (usually its repo). Powers the directory card's "Homepage"
  // link. String, so it takes the `raw || null` branch below like the other
  // non-numeric fields.
  "homepage",
];

/** A comma-separated CSV cell ("climate, python, remote-sensing") as a de-duplicated list. */
function splitList(value) {
  if (!value) return [];
  return [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))];
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Joins README entries with CSV rows by normalized URL, then by name. */
function buildDirectory(readmeText, projectsCsvText) {
  const entries = parseReadmeEntries(readmeText);
  const csvRows = projectsCsvText ? parseCsvRows(projectsCsvText) : [];

  const byUrl = new Map();
  const byName = new Map();
  for (const row of csvRows) {
    const u = normalizeUrl(row.git_url);
    if (u && !byUrl.has(u)) byUrl.set(u, row);
    const n = normalizeName(row.project_names);
    if (n && !byName.has(n)) byName.set(n, row);
  }

  let matchedByUrl = 0;
  let matchedByName = 0;
  let readmeOnly = 0;

  // category name -> subcategory name -> projects[], preserving encounter order.
  const categoryOrder = [];
  const categories = new Map();

  for (const entry of entries) {
    const row = byUrl.get(normalizeUrl(entry.url)) ?? byName.get(normalizeName(entry.name));
    let source;
    if (row && byUrl.has(normalizeUrl(entry.url))) {
      source = "csv";
      matchedByUrl += 1;
    } else if (row) {
      source = "csv";
      matchedByName += 1;
    } else {
      source = "readme";
      readmeOnly += 1;
    }

    const project = {
      name: entry.name,
      url: entry.url,
      description: row?.description || entry.readmeDescription || "",
      category: entry.category,
      subcategory: entry.subcategory,
      source,
    };
    if (row) {
      for (const field of CSV_METRIC_FIELDS) {
        const raw = row[field];
        project[field] = ["stars", "contributors", "total_commits", "downloads_last_month", "score"].includes(field)
          ? numberOrNull(raw)
          : raw || null;
      }
      // For the directory's project overlay: the owner's avatar, the
      // repository's topics, and where to sponsor it.
      project.avatar_url = row.avatar_url || null;
      project.keywords = splitList(row.keywords);
      project.funding_links = splitList(row.funding_links);
    }

    if (!categories.has(entry.category)) {
      categories.set(entry.category, { name: entry.category, subcategoryOrder: [], subcategories: new Map() });
      categoryOrder.push(entry.category);
    }
    const categoryBucket = categories.get(entry.category);
    const subKey = entry.subcategory ?? "";
    if (!categoryBucket.subcategories.has(subKey)) {
      categoryBucket.subcategories.set(subKey, { name: entry.subcategory, projects: [] });
      categoryBucket.subcategoryOrder.push(subKey);
    }
    categoryBucket.subcategories.get(subKey).projects.push(project);
  }

  const categoriesOut = categoryOrder.map((name) => {
    const bucket = categories.get(name);
    return {
      name,
      subcategories: bucket.subcategoryOrder.map((key) => bucket.subcategories.get(key)),
    };
  });

  return {
    generated_at: new Date().toISOString(),
    source: csvRows.length > 0 ? "csv+readme" : "readme-only",
    totals: {
      categories: categoriesOut.length,
      subcategories: categoriesOut.reduce((n, c) => n + c.subcategories.length, 0),
      projects: entries.length,
      matched_from_csv: matchedByUrl + matchedByName,
      matched_by_url: matchedByUrl,
      matched_by_name: matchedByName,
      readme_only: readmeOnly,
    },
    categories: categoriesOut,
  };
}

async function fetchDirectory(projectsCsvText) {
  const readmeText = await resolve("README.md", {
    remoteUrl: OST_README_REMOTE_URL,
    localPath: path.join(OST_README_REPO_LOCAL_PATH, "README.md"),
    fallbackPath: null, // no raw-README fallback; directory.json's own fallback covers this tier
  });

  if (readmeText === null || projectsCsvText === null) {
    // Missing either input produces a materially worse directory.json than
    // what's already sitting in the repo: no README means no project list at
    // all to build from; no CSV means every one of ~2,753 entries would
    // render with zero metrics (source: "readme") even though most of them
    // really do have a CSV row — CSV was just unreachable this run. Either
    // way, the committed snapshot (built from both, sampled down) is the
    // better fallback than building a degraded join from whichever half
    // came through.
    const fallback = await readLocal(path.join(FALLBACK_DIR, "directory.json"));
    if (fallback !== null) {
      console.log("[fetch-data] directory.json: committed fallback snapshot (public/data/fallback/directory.json)");
      await writeFile(path.join(DATA_DIR, "directory.json"), fallback, "utf-8");
    } else {
      console.warn("[fetch-data] directory.json: no source available at all");
    }
    return;
  }

  const directory = buildDirectory(readmeText, projectsCsvText);
  console.log(
    `[fetch-data] directory.json: built ${directory.totals.projects} projects ` +
      `(${directory.totals.matched_from_csv} from CSV, ${directory.totals.readme_only} README-only) ` +
      `across ${directory.totals.categories} categories`,
  );
  await writeFile(path.join(DATA_DIR, "directory.json"), JSON.stringify(directory), "utf-8");
}

// ---------------------------------------------------------------------------

// 4. Rankings + CSV → public/data/project-attribute-records.json
// ---------------------------------------------------------------------------
//
// project-attributes.json only carries totals (694 MIT, 936 Python, ...), so
// the /analytics/projects filters cannot narrow it. This writes one row of
// those same attributes per ranked project, for the page to recount over
// whichever categories are selected.

/**
 * pandas' default `na_values`. The pipeline reads projects.csv with a bare
 * `pd.read_csv`, so any of these cell values is missing to it and counts as
 * "Unknown" in project-attributes.json.
 */
const PANDAS_NA_VALUES = new Set([
  "", "#N/A", "#N/A N/A", "#NA", "-1.#IND", "-1.#QNAN", "-NaN", "-nan",
  "1.#IND", "1.#QNAN", "<NA>", "N/A", "NA", "NULL", "NaN", "None", "n/a",
  "nan", "null",
]);

const ATTRIBUTE_FIELDS = ["code_of_conduct", "contributing_guide", "license", "language", "platform"];

/** `count_series_values` in build_analytics_payloads.py: missing or blank is "Unknown". */
function attributeLabel(raw) {
  if (raw === undefined || raw === null || PANDAS_NA_VALUES.has(raw)) return "Unknown";
  return String(raw).trim() || "Unknown";
}

/**
 * The pipeline splits `ecosystems` on "," and counts every part — repeats,
 * and the empty part after each value's trailing comma, included.
 */
function ecosystemLabels(raw) {
  if (raw === undefined || raw === null || PANDAS_NA_VALUES.has(raw)) return ["Unknown"];
  return String(raw).split(",").map((part) => part.trim() || "Unknown");
}

function countLabels(labels) {
  const counts = new Map();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return counts;
}

function buildProjectAttributeRecords(rankings, aggregate, projectsCsvText) {
  // Rankings `url` is the pipeline's `git_url`, stripped; unique per project.
  const byUrl = new Map();
  for (const row of parseCsvRows(projectsCsvText)) {
    const url = (row.git_url ?? "").trim();
    if (url && !byUrl.has(url)) byUrl.set(url, row);
  }

  const records = rankings.records.map((project) => {
    const row = byUrl.get(project.url);
    let attributes = null;
    if (row) {
      attributes = Object.fromEntries(ATTRIBUTE_FIELDS.map((field) => [field, attributeLabel(row[field])]));
      attributes.ecosystems = ecosystemLabels(row.ecosystems);
    }
    return {
      category: project.category,
      sub_category: project.sub_category,
      active: project.is_active_last_365d,
      attributes,
    };
  });

  // Recount the whole set and hold it against the pipeline's own totals. They
  // agree exactly when projects.csv is the snapshot the payloads were built
  // from; a newer CSV (the upstream bot updates it monthly, the payloads are
  // rebuilt by hand) drops projects and shifts values.
  const described = records.filter((record) => record.attributes !== null);
  let matchesAggregate = Boolean(aggregate) && described.length === records.length;
  for (const field of [...ATTRIBUTE_FIELDS, "ecosystems"]) {
    if (!matchesAggregate) break;
    const ours = countLabels(
      described.flatMap((record) =>
        field === "ecosystems" ? record.attributes.ecosystems : [record.attributes[field]],
      ),
    );
    const theirs = aggregate.fields[field] ?? [];
    matchesAggregate =
      theirs.length === ours.size && theirs.every((entry) => ours.get(entry.label) === entry.count);
  }

  return {
    generated_at: new Date().toISOString(),
    source_generated_at: rankings.generated_at,
    top_n_default: aggregate?.top_n_default ?? 30,
    coverage: {
      projects: records.length,
      with_attributes: described.length,
      matches_aggregate: matchesAggregate,
    },
    records,
  };
}

async function fetchProjectAttributeRecords(projectsCsvText) {
  const target = path.join(DATA_DIR, "project-attribute-records.json");
  const rankingsText = await readLocal(path.join(DATA_DIR, "project-rankings.json"));
  const aggregateText = await readLocal(path.join(DATA_DIR, "project-attributes.json"));

  if (projectsCsvText === null || rankingsText === null) {
    const fallback = await readLocal(path.join(FALLBACK_DIR, "project-attribute-records.json"));
    if (fallback !== null) {
      console.log("[fetch-data] project-attribute-records.json: committed fallback snapshot");
      await writeFile(target, fallback, "utf-8");
    } else {
      console.warn("[fetch-data] project-attribute-records.json: no source available at all");
    }
    return;
  }

  const payload = buildProjectAttributeRecords(
    JSON.parse(rankingsText),
    aggregateText ? JSON.parse(aggregateText) : null,
    projectsCsvText,
  );
  const { projects, with_attributes, matches_aggregate } = payload.coverage;
  console.log(
    `[fetch-data] project-attribute-records.json: ${with_attributes} of ${projects} ranked projects found in projects.csv`,
  );
  if (!matches_aggregate) {
    console.warn(
      "[fetch-data] project-attribute-records.json: recounting it does not reproduce " +
        "project-attributes.json, so projects.csv is a different snapshot from the payloads. " +
        "Filtered attribute charts will count the projects they can and say how many they left out.",
    );
  }
  await writeFile(target, JSON.stringify(payload), "utf-8");
}

// ---------------------------------------------------------------------------

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  await fetchAnalyticsPayloads();
  // Read once: the directory and the attribute records both join against it.
  const projectsCsvText = await resolve("projects.csv", {
    remoteUrl: ANALYTICS_DATA_CSV_REMOTE_BASE ? `${ANALYTICS_DATA_CSV_REMOTE_BASE}/projects.csv` : null,
    localPath: path.join(ANALYTICS_REPO_LOCAL_PATH, "data", "projects.csv"),
    fallbackPath: null,
  });
  await fetchDirectory(projectsCsvText);
  await fetchProjectAttributeRecords(projectsCsvText);
}

main().catch((error) => {
  console.error("[fetch-data] failed:", error);
  process.exitCode = 1;
});
