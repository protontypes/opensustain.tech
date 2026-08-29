import Link from "next/link";

import { EcosystemSunburstChart } from "@/components/charts/ecosystem-sunburst-chart";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadEcosystemSunburst, loadFilters, loadProjectRankings, loadSummary } from "@/lib/data";
import { formatCompactNumber, formatDecimal, formatPercent } from "@/lib/format";

export default async function HomePage() {
  const [summary, ecosystem, filters, projectRankings] = await Promise.all([
    loadSummary(),
    loadEcosystemSunburst(),
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
          hint={`${summary.source.projects_rows} in source`}
        />
        <MetricCard
          label="Organizations"
          value={formatCompactNumber(summary.totals.organizations)}
          hint={`${summary.source.organizations_rows} in source`}
        />
        <MetricCard
          label="Contributors"
          value={formatCompactNumber(summary.totals.contributors)}
          hint={`${formatPercent(activeRate)} active share`}
        />
        <MetricCard
          label="Median Age"
          value={`${formatDecimal(summary.medians.project_age_years, 1)}y`}
          hint={`Median DDS ${formatDecimal(summary.medians.dds, 3)}`}
        />
      </section>

      <section className="content-section">
        <div className="stack">
          <Panel
            title="Ecosystem Sunburst"
            description="Interactive visualization of the full open-source sustainability ecosystem, organized by category and sub-category."
          >
            <EcosystemSunburstChart payload={ecosystem} />
          </Panel>
  <section className="content-section">
        <Panel>
          <SectionHeading
            eyebrow="Palette"
            title="Category colors"
            description="Shared color tokens used across all visualizations for consistency."
          />
          <div className="chip-grid">
            {filters.categories.map((category) => (
              <span
                key={category}
                className="category-chip"
                style={{
                  backgroundColor: filters.category_colors[category] ?? "#2563eb",
                }}
              >
                {category}
              </span>
            ))}
          </div>
        </Panel>
      </section>
          <Panel
            title="Top Projects"
            description="Ranked by combined health and community score."
          >
            <ol className="leader-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", columnGap: "64px" }}>
              {topProjects.map((project, index) => (
                <li key={project.url || project.name} className="leader-list-item" style={{ padding: "16px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div>
                      <p className="leader-rank" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "4px" }}>{String(index + 1).padStart(2, "0")}</p>
                      <a href={project.url} target="_blank" rel="noreferrer" className="inline-link" style={{ fontSize: "16px", marginBottom: "4px" }}>
                        {project.name}
                      </a>
                      <p className="leader-meta" style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
                        {project.category} · {project.sub_category}
                      </p>
                    </div>
                    <strong style={{ fontSize: "18px" }}>{formatDecimal(project.total_score_combined, 2)}</strong>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <div style={{ marginTop: "32px" }}>
            <SectionHeading
              eyebrow="Analytics"
              title="Explore Ecosystem"
              description="Deep-dive into specialized dashboards for deeper insights."
            />
            <div className="three-column-grid" style={{ marginTop: "32px" }}>
              <Link href="/projects" className="panel" style={{ display: "block", textDecoration: "none" }}>
                <h3 className="panel-title" style={{ marginBottom: "8px" }}>Projects</h3>
                <p className="panel-description">Detailed insights into project rankings, lifecycle trends, and community attributes.</p>
              </Link>
              <Link href="/organizations" className="panel" style={{ display: "block", textDecoration: "none" }}>
                <h3 className="panel-title" style={{ marginBottom: "8px" }}>Organizations</h3>
                <p className="panel-description">Analyze the geographic distribution and hierarchy of contributing organizations.</p>
              </Link>
              <Link href="/topics" className="panel" style={{ display: "block", textDecoration: "none" }}>
                <h3 className="panel-title" style={{ marginBottom: "8px" }}>Topics</h3>
                <p className="panel-description">Explore the most frequent terms and thematic clusters extracted from documentation.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

    
    </main>
  );
}
