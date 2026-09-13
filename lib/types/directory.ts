/** One entry in the OST project directory. See DATA_CONTRACT.md. */
export type DirectoryProject = {
  name: string;
  url: string;
  description: string;
  category: string;
  subcategory: string | null;
  /** "csv" when data/projects.csv had a matching row; "readme" otherwise. */
  source: "csv" | "readme";
  /**
   * The project's own site, from the CSV's `homepage` column — distinct from
   * `url`, which is whatever link the README lists (usually, but not always,
   * the source repo). Present only when source === "csv" and the crawler
   * found one; many projects have no separate homepage from their repo.
   */
  homepage: string | null;
  stars: number | null;
  language: string | null;
  license: string | null;
  contributors: number | null;
  total_commits: number | null;
  downloads_last_month: number | null;
  score: number | null;
  platform: string | null;
  latest_commit_activity: string | null;
  project_created_at: string | null;
  /**
   * The next three feed the project overlay. Optional, because a
   * directory.json built before they existed (an older fallback snapshot)
   * does not carry them.
   */
  /** The owner's avatar (GitHub's `<owner>.png`). */
  avatar_url?: string | null;
  /** The repository's topics, as the crawler recorded them. */
  keywords?: string[];
  /** Sponsorship pages: GitHub Sponsors, Open Collective, ... */
  funding_links?: string[];
};

export type DirectorySubcategory = {
  name: string | null;
  projects: DirectoryProject[];
};

export type DirectoryCategory = {
  name: string;
  subcategories: DirectorySubcategory[];
};

export type DirectoryPayload = {
  generated_at: string;
  source: "csv+readme" | "readme-only" | "fallback-snapshot";
  totals: {
    categories: number;
    subcategories: number;
    projects: number;
    matched_from_csv: number;
    matched_by_url: number;
    matched_by_name: number;
    readme_only: number;
  };
  categories: DirectoryCategory[];
};
