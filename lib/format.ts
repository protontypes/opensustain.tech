export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDecimal(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * "1 organization" / "47 organizations".
 *
 * A count of one is common in these charts — a country filter can leave a
 * single organization in a single sub-category — so the plural has to bend.
 */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/**
 * SPDX identifiers arrive lower-cased. Segments that are acronyms (and single
 * letters, as in CERN-OHL-S) go up, the rest are capitalised: "bsd-3-clause"
 * → "BSD-3-Clause", "apache-2.0" → "Apache-2.0", "cern-ohl-s-2.0" →
 * "CERN-OHL-S-2.0". Anything not covered keeps a readable capitalised form.
 */
const LICENSE_ACRONYMS = new Set([
  "0bsd", "agpl", "bsd", "bsl", "by", "cc", "cc0", "cecill", "cern", "epl",
  "eupl", "gpl", "isc", "lgpl", "mit", "mpl", "nc", "nd", "ofl", "ogl", "ohl",
  "sa", "upl",
]);

export function formatLicense(raw: string): string {
  return raw
    .split("-")
    .map((part) =>
      LICENSE_ACRONYMS.has(part) || part.length === 1
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("-");
}
