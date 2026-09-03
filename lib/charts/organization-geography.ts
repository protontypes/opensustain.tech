import type {
  OrganizationCountryRecord,
  OrganizationsOverviewPayload,
} from "@/lib/types";

/**
 * Resolving an organization's raw `location_country` to the payload's own
 * country buckets.
 *
 * The pipeline runs `country_converter` over every organization and emits only
 * the aggregates — `countries`, `continent_counts` — so nothing carries a
 * per-organization ISO code. Filtering the geography charts means redoing that
 * join in the browser.
 *
 * Almost all of it is exact: a raw value matches a `country_name` or an
 * `iso_alpha` outright. The tables below cover what is left. They duplicate
 * knowledge that lives in the pipeline, so `verifyGeography` checks the whole
 * reconstruction against the payload's own totals and complains in development
 * if the data moves underneath them.
 */

/**
 * Raw values no exact match reaches — city names, an abbreviation and a typo,
 * all of which `country_converter` resolves.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  berlin: "DEU",
  german: "DEU",
  london: "GBR",
  uk: "GBR",
  frace: "FRA",
  "south australia": "AUS",
  "czech republic": "CZE",
};

/**
 * Continent per bucket, for the 43 the payload contains. "Global", "EU" and
 * "Europe" are the pipeline's own non-country buckets. Cyprus is Asia, which is
 * where `country_converter` puts it.
 */
const CONTINENTS: Record<string, string> = {
  USA: "America", CAN: "America", BRA: "America", CHL: "America",
  ARG: "America", PAN: "America",
  DEU: "Europe", GBR: "Europe", FRA: "Europe", NLD: "Europe", CHE: "Europe",
  ESP: "Europe", ITA: "Europe", SWE: "Europe", NOR: "Europe", DNK: "Europe",
  FIN: "Europe", AUT: "Europe", BEL: "Europe", POL: "Europe", PRT: "Europe",
  IRL: "Europe", GRC: "Europe", CZE: "Europe", SVN: "Europe",
  EU: "Europe", Europe: "Europe",
  AUS: "Oceania", NZL: "Oceania",
  CHN: "Asia", JPN: "Asia", IND: "Asia", IRN: "Asia", ISR: "Asia",
  SGP: "Asia", TWN: "Asia", THA: "Asia", CYP: "Asia",
  ZAF: "Africa", KEN: "Africa", UGA: "Africa", MLI: "Africa",
  Global: "Global",
};

/** Anything the tables do not know, kept visible rather than dropped. */
export const UNKNOWN_CONTINENT = "Not recorded";

export type CountryIndex = {
  /** Raw `location_country` → the payload's bucket key, or null. */
  resolve: (raw: string | null | undefined) => string | null;
  byIso: Map<string, OrganizationCountryRecord>;
  continentOf: (iso: string) => string;
};

export function buildCountryIndex(
  countries: OrganizationCountryRecord[],
): CountryIndex {
  const byIso = new Map(countries.map((c) => [c.iso_alpha, c]));
  const byName = new Map(countries.map((c) => [c.country_name, c.iso_alpha]));

  return {
    byIso,
    resolve(raw) {
      const text = (raw ?? "").trim();
      if (!text) return null;
      if (byIso.has(text)) return text;
      return byName.get(text) ?? COUNTRY_ALIASES[text.toLowerCase()] ?? null;
    },
    continentOf(iso) {
      return CONTINENTS[iso] ?? UNKNOWN_CONTINENT;
    },
  };
}

/** `form_of_organization` is lower-cased in the source but not consistently. */
export function normalizeType(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

export function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

let verified = false;

/**
 * Checks the reconstruction against the payload's own aggregates.
 *
 * The tables above encode judgements made by `country_converter` inside a
 * pipeline this app does not own and a bot regenerates. If a new country or a
 * new spelling appears, the counts drift silently — every filtered chart would
 * be quietly short. This recomputes `countries` and `continent_counts` from
 * `organizations_by_project_count` and reports any disagreement. Runs once, in
 * development only.
 */
export function verifyGeography(payload: OrganizationsOverviewPayload): void {
  if (verified || process.env.NODE_ENV === "production") return;
  verified = true;

  const index = buildCountryIndex(payload.countries);
  const orgs = new Map<string, number>();
  const projects = new Map<string, number>();
  const unresolved = new Set<string>();

  for (const record of payload.organizations_by_project_count) {
    const iso = index.resolve(record.location_country);
    if (!iso) {
      const raw = record.location_country.trim();
      if (raw) unresolved.add(raw);
      continue;
    }
    orgs.set(iso, (orgs.get(iso) ?? 0) + 1);
    projects.set(
      iso,
      (projects.get(iso) ?? 0) + record.total_listed_projects_in_organization,
    );
  }

  const problems: string[] = [];
  if (unresolved.size > 0) {
    problems.push(`unresolved location_country: ${[...unresolved].join(", ")}`);
  }
  for (const country of payload.countries) {
    const gotOrgs = orgs.get(country.iso_alpha) ?? 0;
    const gotProjects = projects.get(country.iso_alpha) ?? 0;
    if (gotOrgs !== country.organization_count) {
      problems.push(
        `${country.iso_alpha} organizations ${gotOrgs} ≠ ${country.organization_count}`,
      );
    }
    if (gotProjects !== country.total_projects) {
      problems.push(
        `${country.iso_alpha} projects ${gotProjects} ≠ ${country.total_projects}`,
      );
    }
    if (!(country.iso_alpha in CONTINENTS)) {
      problems.push(`${country.iso_alpha} has no continent`);
    }
  }

  const continents = new Map<string, number>();
  for (const country of payload.countries) {
    const key = index.continentOf(country.iso_alpha);
    continents.set(key, (continents.get(key) ?? 0) + country.organization_count);
  }
  for (const record of payload.continent_counts) {
    const got = continents.get(record.continent) ?? 0;
    if (got !== record.count) {
      problems.push(`${record.continent} ${got} ≠ ${record.count}`);
    }
  }

  if (problems.length > 0) {
    console.warn(
      "[organization-geography] the country tables no longer reproduce the payload:\n  " +
        problems.join("\n  ") +
        "\n  See lib/charts/organization-geography.ts.",
    );
  }
}
