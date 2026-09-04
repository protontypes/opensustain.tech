import { loadSummary } from "@/lib/data";

/**
 * When the data was generated.
 *
 * Every payload carries `generated_at` and summary.json also carries `as_of`,
 * and neither reached a page — a snapshot from May presented itself as current,
 * and the footer's copyright year came from the visitor's own clock. The
 * `update_data` bot rebuilds on its own schedule, so staleness is the normal
 * state and has to be visible.
 *
 * Formatted once, server-side, in a fixed locale and timezone: doing it in a
 * client component instead makes the markup differ between the server render
 * and the browser's, which is a hydration mismatch.
 */
export type Snapshot = { iso: string; label: string; year: number };

const FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function snapshotOf(isoDate: string): Snapshot {
  const date = new Date(isoDate);
  return {
    iso: date.toISOString(),
    label: FORMAT.format(date),
    year: date.getUTCFullYear(),
  };
}

export async function loadSnapshot(): Promise<Snapshot> {
  const summary = await loadSummary();
  return snapshotOf(summary.as_of);
}
