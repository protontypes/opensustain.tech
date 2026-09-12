/**
 * "June 14, 2024" from an ISO date string. Pinned to UTC so the render is
 * identical on the build server regardless of its local timezone — a plain
 * `new Date(iso).toLocaleDateString()` without a timezone can shift the date
 * shown by a day depending on where it runs.
 */
export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
