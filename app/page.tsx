import Link from "next/link";

import { EcosystemSunburst } from "@/components/charts/sunburst/ecosystem-sunburst";
import { MetricCard, MetricStat } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters, loadProjectRankings, loadSummary } from "@/lib/data";
import {
  formatCompactNumber,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/format";

const routeCards = [
  {
    href: "/projects",
    title: "Projects",
    description:
      "Detailed insights into project rankings, lifecycle trends, and community attributes.",
  },
  {
    href: "/organizations",
    title: "Organizations",
    description:
      "Analyze the geographic distribution and hierarchy of contributing organizations.",
  },
  {
    href: "/topics",
    title: "Topics",
    description:
      "Explore the most frequent terms and thematic clusters extracted from documentation.",
  },
];

export default async function HomePage() {
  const [summary, filters, projectRankings] = await Promise.all([
    loadSummary(),
    loadFilters(),
    loadProjectRankings(),
  ]);

  const activeRate =
    summary.totals.projects > 0
      ? summary.totals.active_projects / summary.totals.projects
      : 0;
  const topProjects = projectRankings.records.slice(0, 10);

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="section-eyebrow">Overview</p>
        <h1>Open Source <span className="curved-underline">Sustainability</span> Analytics</h1>
        <p className="hero-copy">
          Tracking the health, community engagement, and technological trends
          across the open-source climate-tech ecosystem.
        </p>
        <div className="hero-badges">
          <span>{filters.categories.length} categories</span>
          <span>{filters.sub_categories.length} sub-categories</span>
          <span>{formatPercent(activeRate)} active</span>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard
          label="Projects"
          value={formatCompactNumber(summary.totals.projects)}
          hint={`${formatNumber(summary.totals.projects)} tracked`}
        />
        <MetricCard
          label="Active"
          value={formatCompactNumber(summary.totals.active_projects)}
          hint={`${formatPercent(activeRate)} committed in the past year`}
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
      </section>

      {/* The medians the Streamlit dashboard shows in its second row. They were
          in the payload but only surfaced as hint text on unrelated cards. */}
      <section className="metric-strip" aria-label="Median project statistics">
        <p className="metric-strip__title">Median project</p>
        <div className="metric-strip__items">
          <MetricStat
            label="Age"
            value={`${formatDecimal(summary.medians.project_age_years, 1)}y`}
          />
          <MetricStat
            label="Stars"
            value={formatNumber(summary.medians.stars)}
          />
          <MetricStat
            label="Contributors"
            value={formatDecimal(summary.medians.contributors, 0)}
          />
          <MetricStat
            label="Commits"
            value={formatNumber(summary.medians.total_commits)}
          />
          <MetricStat
            label="Dev. Distribution"
            value={formatDecimal(summary.medians.dds, 3)}
          />
        </div>
      </section>

      <section className="content-section">
        <div className="stack">
          <Panel
            className="panel--viz"
            title="Ecosystem Sunburst"
            description="Every project in the open sustainability landscape, nested by category and sub-category. Colour encodes the metric you choose; click a ring to zoom in."
          >
            <EcosystemSunburst />
          </Panel>
          <Panel
            title="Top Projects"
            description="Ranked by combined health and community score."
          >
            <ol className="leader-list">
              {topProjects.map((project, index) => (
                <li key={project.url || project.name} className="leader-item">
                  <div className="leader-item__body">
                    <p className="leader-item__rank">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-link leader-item__name"
                    >
                      {project.name}
                    </a>
                    <p className="leader-item__meta">
                      {project.category} · {project.sub_category}
                    </p>
                    {/* stars/contributors were already in the payload and unused */}
                    <p className="leader-item__stats">
                      <span>{formatCompactNumber(project.stars)} stars</span>
                      <span>
                        {formatNumber(project.contributors)} contributors
                      </span>
                    </p>
                  </div>
                  <strong className="leader-item__score">
                    {formatDecimal(project.total_score_combined, 2)}
                  </strong>
                </li>
              ))}
            </ol>
          </Panel>

          <div>
            <SectionHeading
              eyebrow="Analytics"
              title="Explore Ecosystem"
              description="Deep-dive into specialized dashboards for deeper insights."
            />
            <div className="route-grid">
              {routeCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="panel route-card"
                >
                  <h3 className="panel-title">{card.title}</h3>
                  <p className="panel-description">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
