import { formatNumber } from "@/lib/format";
import type { KeywordCountRecord } from "@/lib/types";

/** The pipeline's stemmer cuts "species" to "specie"; show the word readers use. */
const DISPLAY: Record<string, string> = { specie: "species" };

const MIN_PX = 13;
const MAX_PX = 40;

/**
 * The most common README keywords, sized by how many projects use them.
 *
 * Drawn here from keyword-counts.json rather than shown as the pipeline's
 * PNG: that image came in its own viridis palette, could not follow the
 * theme, and its words could not be read by a screen reader or copied. Sizes
 * scale with the square root of the count, so area, not height, tracks it;
 * alphabetical order keeps the big words from clumping at the start.
 */
export function WordCloud({ records, limit = 60 }: { records: KeywordCountRecord[]; limit?: number }) {
  const top = records.slice(0, limit);
  if (top.length === 0) return null;
  const max = Math.sqrt(top[0].count);
  const min = Math.sqrt(top[top.length - 1].count);
  const size = (count: number) =>
    max === min ? MAX_PX : MIN_PX + ((Math.sqrt(count) - min) / (max - min)) * (MAX_PX - MIN_PX);
  const emphasised = new Set(top.slice(0, 10).map((record) => record.keyword));

  return (
    <ul className="word-cloud" aria-label={`The ${top.length} most common README keywords`}>
      {[...top]
        .sort((a, b) => a.keyword.localeCompare(b.keyword))
        .map((record) => (
          <li
            key={record.keyword}
            className={emphasised.has(record.keyword) ? "word-cloud__word is-top" : "word-cloud__word"}
            style={{ fontSize: `${size(record.count).toFixed(1)}px` }}
            title={`${DISPLAY[record.keyword] ?? record.keyword}: ${formatNumber(record.count)} projects`}
          >
            {DISPLAY[record.keyword] ?? record.keyword}
          </li>
        ))}
    </ul>
  );
}
