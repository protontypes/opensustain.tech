import type { RankingMetricId } from "@/lib/types";

export type MetricHelp = {
  /** One sentence a reader can act on. */
  text: string;
  /** Where the full definition lives, if there is one. */
  href?: string;
  hrefLabel?: string;
};

/**
 * What each ranking metric means.
 *
 * Nine metrics were offered with no definition anywhere in the app, three of
 * which need one badly: `total_score_combined` is the default ranking on two
 * routes and is a sum of six min-max normalised values, so it runs 0–6 and
 * reads as a rating out of 5; DDS is a 0–1 ratio whose direction is not
 * obvious; and the Ecosyste.ms score has no stated range at all. Streamlit
 * carried all three in an "Understanding the Metrics" panel
 * (streamlit-app-tab.py:272) that was never brought over.
 */
export const METRIC_HELP: Partial<Record<RankingMetricId, MetricHelp>> = {
  total_score_combined: {
    text:
      "A composite: contributors, commits, stars, the Ecosyste.ms score, DDS " +
      "and monthly downloads, each rescaled to 0–1 across the whole dataset " +
      "and added together. It runs 0–6, not 0–5, and rewards projects that " +
      "are active on several dimensions at once rather than outstanding on one.",
  },
  score: {
    text:
      "Ecosyste.ms' own popularity and science score, built from repository " +
      "activity, downstream dependents, downloads, citations and academic " +
      "engagement.",
    href: "https://github.com/ecosyste-ms/ost/blob/main/docs/project_scoring.md",
    hrefLabel: "How it is calculated",
  },
  dds: {
    text:
      "Development Distribution Score: how evenly commits are spread across a " +
      "project's contributors, from 0 to 1. Higher is a broader base; lower " +
      "means a single maintainer carries the project.",
    href: "https://report.opensustain.tech/chapters/development-distribution-score.html",
    hrefLabel: "DDS in the OpenSustain report",
  },
  citations: {
    text:
      "Academic citations recorded for the project. Reported for a small " +
      "minority — absence reflects whether a DOI or Zenodo record is linked, " +
      "not impact.",
  },
  downloads_last_month: {
    text:
      "Package-registry downloads in the last month. Only projects published " +
      "to a registry have one, so a zero is usually 'not published' rather " +
      "than 'unused'.",
  },
  total_number_of_dependencies: {
    text: "How many packages this project itself depends on.",
  },
  contributors: { text: "Distinct people who have committed to the repository." },
  stars: { text: "Stars on the hosting platform — attention, not use." },
  total_commits: { text: "Commits over the project's whole history." },
};
