import type { DirectoryProject } from "@/lib/types/directory";

/** Strips scheme, `www.` and trailing slashes, for comparing two URLs. */
export function normalizeForCompare(url: string | null | undefined): string {
  if (!url) return "";
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\/(www\.)?/i, "")
    .toLowerCase();
}

export function isGithubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\//i.test(url);
}

/** "github.com/pvlib/pvlib-python" — a URL as a reader scans it. */
export function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url;
  }
}

export function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

/** The project's own site, when it is somewhere other than the listed URL. */
export function distinctHomepage(project: DirectoryProject): string | null {
  return project.homepage &&
    normalizeForCompare(project.homepage) !== normalizeForCompare(project.url)
    ? project.homepage
    : null;
}
