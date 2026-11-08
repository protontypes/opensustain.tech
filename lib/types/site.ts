/**
 * public/data/site-totals.json: every count a page shows, computed once by
 * scripts/fetch-data.mjs. See DATA_CONTRACT.md.
 */
export type SiteTotals = {
  generated_at: string;
  /** The analytics snapshot the activity and metric counts come from. */
  as_of: string;
  /** Every project OST's README lists: the headline. */
  projects: number;
  /** Of those, the ones ecosyste.ms tracks, so with stars, commits, activity. */
  projects_with_metrics: number;
  /** Of those, the ones with a commit in the 365 days before `as_of`. */
  active_projects: number;
  categories: number;
  subcategories: number;
  organizations: number;
  contributors: number;
  /** education.md's courses, books and tutorials, counted apart from projects. */
  learning_resources: number;
  learning_topics: number;
};

/** One resource from education.md. */
export type LearningResource = {
  name: string;
  url: string;
  description: string;
};

/** public/data/education.json, in education.md's own order and grouping. */
export type EducationPayload = {
  generated_at: string;
  totals: { resources: number; topics: number };
  topics: Array<{
    name: string;
    subtopics: Array<{ name: string | null; resources: LearningResource[] }>;
  }>;
};
