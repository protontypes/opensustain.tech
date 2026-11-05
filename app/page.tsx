import Link from "next/link";

import { EcosystemSunburst } from "@/components/charts/sunburst/ecosystem-sunburst";
import { LegacyAnchorRedirect } from "@/components/seo/legacy-anchor-redirect";
import { LinkList, type LinkListItem } from "@/components/ui/link-list";
import { loadFilters, loadSummary } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { climateTriageLink, contributeLink, routes } from "@/lib/navigation";

/* The next places to go once the chart has done its job. */
const furtherReading: LinkListItem[] = [
  {
    href: routes.projects,
    title: "Project directory",
    description:
      "Every project as a searchable list, filtered by category and subcategory.",
  },
  {
    href: routes.analytics,
    title: "Analytics",
    description:
      "Project health, the organizations behind the work, and the topics that recur across it.",
  },
  {
    href: routes.blog,
    title: "Articles and talks",
    description:
      "Writing and recorded talks from the community on open source and climate technology.",
  },
  {
    href: climateTriageLink.href,
    title: climateTriageLink.label,
    description:
      "Open issues across these projects that are ready for a first contribution.",
    external: true,
  },
];

export default async function HomePage() {
  const [summary, filters] = await Promise.all([loadSummary(), loadFilters()]);

  return (
    <main className="home">
      <LegacyAnchorRedirect
        subCategoriesByCategory={filters.sub_categories_by_category}
      />
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__text">
          <h1 id="home-title" className="home-title">
            Open Sustainable Technology
          </h1>
          <p className="home-lede">
            A map of the open-source projects working on climate change,
            sustainable energy, biodiversity and natural resources.
          </p>
          {/*
           * The totals as one sentence rather than a row of stat tiles: they
           * describe the chart beside them, they are not the point of the page.
           */}
          <p className="home-facts">
            {formatNumber(summary.totals.projects)} projects, maintained by{" "}
            {formatNumber(summary.totals.organizations)} organizations and{" "}
            {formatNumber(summary.totals.contributors)} contributors, sorted into{" "}
            {filters.categories.length} categories and{" "}
            {filters.sub_categories.length} subcategories.
          </p>
          <div className="home-actions">
            <Link className="home-action home-action--primary" href={routes.projects}>
              Browse the directory
            </Link>
            <a
              className="home-action"
              href={contributeLink.href}
              target="_blank"
              rel="noreferrer"
            >
              Add a project
            </a>
          </div>
        </div>
        <div className="home-hero__chart">
          <EcosystemSunburst variant="hero" />
        </div>
      </section>

      <section className="split-section" aria-labelledby="home-more-title">
        <h2 id="home-more-title" className="split-section__title">
          Beyond the chart
        </h2>
        <LinkList items={furtherReading} />
        <p className="split-section__note">
          The list is maintained in the open on GitHub. Anyone can add a project
          or correct an entry with a pull request.
        </p>
      </section>
    </main>
  );
}
