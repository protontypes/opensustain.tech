import Link from "next/link";

import { EcosystemSunburst } from "@/components/charts/sunburst/ecosystem-sunburst";
import { CategoryExplorer, type ExplorerCategory } from "@/components/home/category-explorer";
import { LegacyAnchorRedirect } from "@/components/seo/legacy-anchor-redirect";
import { PageProvenance } from "@/components/ui/page-provenance";
import { withBasePath } from "@/lib/base-path";
import { loadFilters } from "@/lib/data";
import { loadDirectory } from "@/lib/data/directory";
import { loadSiteTotals } from "@/lib/data/site";
import { formatNumber } from "@/lib/format";
import {
  climateTriageLink,
  contributeLink,
  ostGithubUrl,
  routes,
} from "@/lib/navigation";

/* Where to go once the map has done its job. */
const beyond = [
  {
    tag: "Data",
    title: "Project directory",
    body: "Every project in one searchable, filterable list.",
    cta: "Browse the directory",
    href: routes.projects,
  },
  {
    tag: "Learn",
    title: "Learning resources",
    body: "Open courses, books and tutorials for getting started in sustainable technology.",
    cta: "Start learning",
    href: routes.education,
  },
  {
    tag: "Data",
    title: "Analytics",
    body: "Project health, the organizations behind the work, and the topics that recur across it.",
    cta: "Open analytics",
    href: routes.analytics,
  },
  {
    tag: "Read",
    title: "Articles & talks",
    body: "Writing and recorded talks from the community on open source and climate technology.",
    cta: "Read and watch",
    href: routes.blog,
  },
  {
    tag: "Contribute",
    title: "ClimateTriage",
    body: "Open issues across these projects that are ready for a first contribution.",
    cta: "Visit ClimateTriage",
    href: climateTriageLink.href,
    external: true,
  },
  {
    tag: "Method",
    title: "Methodology",
    body: "Where the data comes from and how each metric is calculated.",
    cta: "How we measure",
    href: routes.methodology,
  },
];

export default async function HomePage() {
  const [totals, filters, directory] = await Promise.all([
    loadSiteTotals(),
    loadFilters(),
    loadDirectory(),
  ]);

  // README order, with a project count per subcategory. Unnamed subcategories
  // go under "General", the name the directory filters them by.
  const categories: ExplorerCategory[] = directory.categories.map((category) => {
    const subcategories = category.subcategories.map((sub) => ({
      name: sub.name ?? "General",
      projects: sub.projects.length,
    }));
    return {
      name: category.name,
      projects: subcategories.reduce((sum, sub) => sum + sub.projects, 0),
      subcategories,
    };
  });

  const stats = [
    { value: formatNumber(totals.projects), label: "Open-source projects" },
    { value: formatNumber(totals.organizations), label: "Maintaining organizations" },
    { value: formatNumber(totals.contributors), label: "Contributors" },
    { value: `${totals.categories} / ${totals.subcategories}`, label: "Categories / subcategories" },
    { value: formatNumber(totals.learning_resources), label: "Learning resources" },
  ];

  return (
    <main className="home">
      <LegacyAnchorRedirect
        subCategoriesByCategory={filters.sub_categories_by_category}
      />

      <section className="home-hero" aria-labelledby="home-title">
        <div className="container home-hero__grid">
          <div className="home-hero__text">
            <p className="kicker">The open source map for climate &amp; sustainability</p>
            <h1 id="home-title" className="home-title">
              Open source for a sustainable planet
            </h1>
            {/* Filled by the chart when a project is clicked. It takes the place
                of the description beside the ring on a wide screen, and rises
                from the bottom edge on a narrow one. */}
            <div id="hero-selection" className="hero-selection" aria-live="polite" />
            <p className="home-lede">
              A map of open-source projects working on climate change, sustainable
              energy, biodiversity and natural resources, curated in the open and
              measured with public data.
            </p>
            {/* A plain GET form: /projects reads ?q= into its own search. */}
            <form className="home-search" action={withBasePath(routes.projects)} role="search">
              <label className="visually-hidden" htmlFor="home-search">
                Search projects
              </label>
              <input
                id="home-search"
                type="search"
                name="q"
                placeholder={`Search ${formatNumber(totals.projects)} projects, e.g. PyPSA, solar, wildfire`}
              />
              <button type="submit" className="pill pill--blue">
                Search
              </button>
            </form>
            <div className="home-actions">
              <Link className="pill pill--ink" href={routes.projects}>
                Browse the directory
              </Link>
              <a className="pill" href="#categories">
                View as a list
              </a>
            </div>
          </div>
          <div className="home-hero__chart">
            <EcosystemSunburst variant="hero" selectionSlot="hero-selection" />
          </div>
        </div>
      </section>

      <section className="home-stats" aria-labelledby="home-stats-title">
        <h2 id="home-stats-title" className="visually-hidden">
          The map in numbers
        </h2>
        <div className="container">
          <dl className="home-stats__grid">
            {stats.map((stat) => (
              <div key={stat.label} className="home-stat">
                <dt className="kicker">{stat.label}</dt>
                <dd className="home-stat__value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="container home-stats__source">
          <PageProvenance totals={totals} className="page-provenance--home">
            {" "}
            · Metrics from{" "}
            <a href="https://ecosyste.ms/" target="_blank" rel="noreferrer">
              Ecosyste.ms
            </a>
          </PageProvenance>
        </div>
      </section>

      <section id="categories" className="home-section" aria-labelledby="categories-title">
        <div className="container">
          <div className="home-section__head">
            <h2 id="categories-title" className="home-section__title">
              Explore by category
            </h2>
            <p className="home-section__intro">
              {totals.categories} categories and {totals.subcategories} subcategories, each in
              its colour on the map above. Pick one to see its subcategories.
            </p>
          </div>
          <CategoryExplorer categories={categories} />
        </div>
      </section>

      <section className="home-band" aria-labelledby="home-band-title">
        <div className="container home-band__inner">
          <h2 id="home-band-title" className="home-band__title">
            Know a project
            <br />
            we’re missing?
          </h2>
          <p className="home-band__text">
            The list is maintained in the open on GitHub. Anyone can add a project or
            correct an entry with a pull request.
          </p>
          <div className="home-actions">
            <a className="pill pill--blue" href={contributeLink.href} target="_blank" rel="noreferrer">
              Read the contributing guide
            </a>
            <a className="pill" href={ostGithubUrl} target="_blank" rel="noreferrer">
              Open on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="beyond-title">
        <div className="container">
          <div className="home-section__head">
            <h2 id="beyond-title" className="home-section__title">
              Beyond the map
            </h2>
            <p className="kicker">Data · Learning · Community</p>
          </div>
          <ul className="beyond-grid">
            {beyond.map((item) => {
              const body = (
                <>
                  <span className="kicker beyond-card__tag">{item.tag}</span>
                  <span className="beyond-card__title">{item.title}</span>
                  <span className="beyond-card__body">{item.body}</span>
                  <span className="beyond-card__cta">
                    {item.cta} <span aria-hidden="true">{item.external ? "↗" : "→"}</span>
                  </span>
                </>
              );
              return (
                <li key={item.title}>
                  {item.external ? (
                    <a className="beyond-card" href={item.href} target="_blank" rel="noreferrer">
                      {body}
                    </a>
                  ) : (
                    <Link className="beyond-card" href={item.href}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="home-callout-section" aria-labelledby="triage-title">
        <div className="container">
          <div className="home-callout">
            <div className="home-callout__text">
              <p className="kicker home-callout__kicker">First contribution?</p>
              <h2 id="triage-title" className="home-callout__title">
                Start on ClimateTriage
              </h2>
              <p className="home-callout__body">
                Open issues from projects on this map, ready for your first pull request.
              </p>
            </div>
            <a
              className="pill pill--mint"
              href={climateTriageLink.href}
              target="_blank"
              rel="noreferrer"
            >
              Find an issue <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
