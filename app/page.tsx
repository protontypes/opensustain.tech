import Link from "next/link";

import { LegacyAnchorRedirect } from "@/components/seo/legacy-anchor-redirect";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters, loadSummary } from "@/lib/data";
import { formatCompactNumber, formatNumber } from "@/lib/format";
import { externalNavigation, routes } from "@/lib/navigation";

const exploreCards = [
  {
    href: routes.projects,
    title: "Project Directory",
    description:
      "Browse every open-source project in the ecosystem, grouped by category and subcategory, searchable by name and description.",
  },
  {
    href: routes.analytics,
    title: "Analytics",
    description:
      "Dashboards on project health, contributing organizations, and the topics that recur across the ecosystem's documentation.",
  },
  {
    href: routes.blog,
    title: "Blog",
    description:
      "Community writing on open source, climate technology, and the ecosystem this directory tracks.",
  },
];

export default async function HomePage() {
  const [summary, filters] = await Promise.all([loadSummary(), loadFilters()]);

  return (
    <main className="page-shell">
      <LegacyAnchorRedirect
        subCategoriesByCategory={filters.sub_categories_by_category}
      />
      <section className="hero">
        <h1>
          Open <span className="curved-underline">Sustainable</span> Technology
        </h1>
        <p className="hero-copy">
          A directory and analysis of the open-source ecosystem in climate
          change, sustainable energy, biodiversity, and natural resources.
        </p>
        {/*
         * The categories/subcategories/organizations counts used to repeat
         * here as a small inline line, directly duplicating the four stat
         * tiles right below — the same numbers shown twice in a row. Removed
         * so each one appears exactly once, in the tiles.
         */}
        <p className="hero-scope">
          Community-maintained on GitHub —{" "}
          {externalNavigation.map((link, index) => (
            <span key={link.href}>
              <a
                className="inline-link"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
              {index < externalNavigation.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      </section>

      <section className="metric-grid">
        <MetricCard
          label="Projects"
          value={formatCompactNumber(summary.totals.projects)}
          hint={`${formatNumber(summary.totals.projects)} tracked`}
        />
        <MetricCard
          label="Organizations"
          value={formatCompactNumber(summary.totals.organizations)}
          hint="Maintaining these projects"
        />
        <MetricCard
          label="Contributors"
          value={formatCompactNumber(summary.totals.contributors)}
          hint="Across the whole ecosystem"
        />
        <MetricCard
          label="Categories"
          value={String(filters.categories.length)}
          hint={`${filters.sub_categories.length} subcategories`}
        />
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Explore"
          title="Start here"
          description="Three ways into the ecosystem."
        />
        <div className="route-grid">
          {exploreCards.map((card) => (
            <Link key={card.href} href={card.href} className="panel route-card">
              <h3 className="panel-title">{card.title}</h3>
              <p className="panel-description">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
