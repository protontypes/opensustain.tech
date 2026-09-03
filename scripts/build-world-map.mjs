/**
 * Builds public/geo/world-110m.json — the only geometry the choropleth needs.
 *
 * Run with: node scripts/build-world-map.mjs
 *
 * ECharts has to be handed a map to register; it ships none. Natural Earth's
 * 110m admin-0 set is the right scale for a world choropleth, but the published
 * file is 819 KB, almost all of it attributes this chart never reads — 90-odd
 * properties per feature including the country name in 25 languages. Stripping
 * it to an ISO code and a name, and rounding coordinates to 2 decimals (about
 * 1.1 km, well under one screen pixel at world scale), takes it to ~175 KB and
 * 54 KB over the wire.
 *
 * Keyed on `iso_a3` so the payload's own `iso_alpha` joins straight to it; the
 * chart passes `nameProperty: "iso_a3"` rather than matching on country names,
 * which differ between the two sources ("United States" vs "United States of
 * America").
 *
 * This is app-owned, unlike everything under public/data, which
 * scripts/build_analytics_payloads.py regenerates.
 */
import { mkdir, writeFile } from "node:fs/promises";

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const OUT = new URL("../public/geo/world-110m.json", import.meta.url);
const PRECISION = 2;

/**
 * Natural Earth's 110m set drops Singapore — at that scale a city-state is
 * smaller than the generalisation tolerance — but the payload has four
 * organizations there. This is its real bounding box, not an invented shape.
 */
const SINGAPORE = {
  type: "Feature",
  properties: { iso_a3: "SGP", name: "Singapore" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [103.6, 1.15],
        [104.1, 1.15],
        [104.1, 1.48],
        [103.6, 1.48],
        [103.6, 1.15],
      ],
    ],
  },
};

const round = (node) =>
  Array.isArray(node)
    ? typeof node[0] === "number"
      ? node.map((value) => Number(value.toFixed(PRECISION)))
      : node.map(round)
    : node;

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${SOURCE} → HTTP ${response.status}`);
const source = await response.json();

/**
 * Antarctica has no organizations and takes a sixth of the map's height, so
 * dropping it lets the inhabited world fill the frame — the same choice almost
 * every world choropleth makes.
 */
const DROP = new Set(["ATA"]);

const features = source.features.map((feature) => {
  const p = feature.properties;
  // ISO_A3 is "-99" for disputed and dependent territories; ISO_A3_EH and
  // ADM0_ISO fill most of those in.
  const iso = [p.ISO_A3_EH, p.ISO_A3, p.ADM0_ISO].find(
    (code) => code && code !== "-99",
  );
  return {
    type: "Feature",
    properties: {
      iso_a3: iso ?? "",
      name: p.NAME_LONG ?? p.ADMIN ?? p.NAME ?? iso ?? "",
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: round(feature.geometry.coordinates),
    },
  };
});
const kept = features.filter((feature) => !DROP.has(feature.properties.iso_a3));
kept.push(SINGAPORE);

await mkdir(new URL("../public/geo/", import.meta.url), { recursive: true });
const json = JSON.stringify({ type: "FeatureCollection", features: kept });
await writeFile(OUT, json);
console.log(`${kept.length} features · ${(json.length / 1024).toFixed(0)} KB`);
