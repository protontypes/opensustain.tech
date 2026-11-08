import type { Metadata } from "next";
import Link from "next/link";

import { EcosystemSunburst } from "@/components/charts/sunburst/ecosystem-sunburst";
import { Avatar } from "@/components/ui/avatar";
import { LinkList } from "@/components/ui/link-list";
import { PageProvenance } from "@/components/ui/page-provenance";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadProjectRankings, loadSummary } from "@/lib/data";
import { loadSiteTotals } from "@/lib/data/site";
import { routes } from "@/lib/navigation";
import {
  formatCompactNumber,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Dashboards on the open-source climate and sustainability ecosystem: project rankings and lifecycle trends, contributing organizations, and the topics and keywords that recur across it.",
};

// This page is the landing spot the header's "Analytics" link points at —
// an overview plus links into the four dashboards below it, rather than a
// second copy of any one of them. /projects itself is not one of these links:
// it's the OST project directory now, not the project-rankings dashboard
// linked here.
const dashboards = [
  {
    href: routes.analyticsProjects,
    title: "Projects",
    description:
      "Rankings, lifecycle trends and community attributes for every project.",
  },
  {
    href: routes.organizations,
    title: "Organizations",
    description:
      "Who maintains the ecosystem, where they are, and what kind of organization they are.",
  },
  {
    href: routes.topics,
    title: "Topics",
    description:
      "The terms and themes that recur across the projects' documentation.",
  },
  {
    href: routes.methodology,
    title: "Methodology",
    description:
      "Where the data comes from, how each metric is defined, and what these dashboards cannot tell you.",
  },
];

export default async function AnalyticsPage() {
  const [summary, totals, projectRankings] = await Promise.all([
    loadSummary(),
    loadSiteTotals(),
    loadProjectRankings(),
  ]);

  // Activity is only known for projects Ecosyste.ms tracks, so the share is
  // of those, not of every listed project.
  const activeRate =
    totals.projects_with_metrics > 0
      ? totals.active_projects / totals.projects_with_metrics
      : 0;
  const topProjects = projectRankings.records.slice(0, 10);

  /*
   * Two short tables instead of a row of big-number tiles and a strip of
   * medians under it: exact figures, each with its unit and its qualifier on
   * the same line, read the way a data appendix reads.
   */
  const ecosystemFigures = [
    { label: "Projects", value: formatNumber(totals.projects) },
    {
      label: "With metrics",
      value: formatNumber(totals.projects_with_metrics),
      note: "tracked by Ecosyste.ms",
    },
    {
      label: "Active in the past year",
      value: formatNumber(totals.active_projects),
      note: `${formatPercent(activeRate)} of those tracked`,
    },
    { label: "Organizations", value: formatNumber(totals.organizations) },
    { label: "Contributors", value: formatNumber(totals.contributors) },
    {
      label: "Categories",
      value: String(totals.categories),
      note: `${totals.subcategories} subcategories`,
    },
  ];
  const medianFigures = [
    {
      label: "Age",
      value: `${formatDecimal(summary.medians.project_age_years, 1)} years`,
    },
    { label: "Stars", value: formatNumber(summary.medians.stars) },
    {
      label: "Contributors",
      value: formatDecimal(summary.medians.contributors, 0),
    },
    { label: "Commits", value: formatNumber(summary.medians.total_commits) },
    {
      label: "Development distribution score",
      value: formatDecimal(summary.medians.dds, 3),
    },
  ];

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Open Source Sustainability Analytics"
        description="The health, activity and community of the open-source climate and sustainability ecosystem, measured."
      />
      {/* Scope and provenance in one line, so a reader arriving from a link
          knows how current this is. */}
      <PageProvenance totals={totals} />

      <section className="key-figures" aria-label="Key figures">
        <FigureTable title="The ecosystem" rows={ecosystemFigures} />
        <FigureTable title="The median project" rows={medianFigures} />
      </section>

      <div className="stack">
        <Panel
          className="panel--viz"
          title="The ecosystem by category"
          description="Every project, nested by category and subcategory. Color encodes the metric you choose; click a ring to zoom in."
        >
          <EcosystemSunburst />
        </Panel>
        <Panel
          title="Top 10 projects"
          description={
            <>
              Ranked by combined health and community score.{" "}
              <Link href={routes.analyticsProjects}>See the full ranking</Link>
            </>
          }
          notes="Scores are computed by Ecosyste.ms from public activity data, not judged by the maintainers. A high rank is not an endorsement."
        >
          <ol className="leader-list">
            {topProjects.map((project, index) => (
              <li key={project.url || project.name} className="leader-item">
                <div className="leader-item__body">
                  <p className="leader-item__rank">{index + 1}</p>
                  {/* Populated on 2,571 of 2,691 records and drawn nowhere. */}
                  <Avatar src={project.avatar_url} name={project.name} />
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-link leader-item__name"
                  >
                    {project.name}
                  </a>
                  <p className="leader-item__meta">
                    {project.category} › {project.sub_category}
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
      </div>

      <section className="split-section" aria-labelledby="dashboards-title">
        <h2 id="dashboards-title" className="split-section__title">
          Dashboards
        </h2>
        <LinkList items={dashboards} />
      </section>
    </main>
  );
}

type FigureRow = { label: string; value: string; note?: string };

function FigureTable({ title, rows }: { title: string; rows: FigureRow[] }) {
  return (
    <div className="figure-table">
      <h2 className="figure-table__title">{title}</h2>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="figure-table__row">
            <dt>{row.label}</dt>
            <dd>
              {row.value}
              {row.note ? (
                <span className="figure-table__note">{row.note}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
