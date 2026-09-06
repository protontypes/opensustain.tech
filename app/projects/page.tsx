import type { Metadata } from "next";

import {
  CodeOfConductChart,
  CommitActivityChart,
  ContributingGuideChart,
  EcosystemsChart,
  LanguagesChart,
  LicensesChart,
  PlatformsChart,
} from "@/components/charts/project-attributes-charts";
import { ProjectRankingsChart } from "@/components/charts/project-rankings-chart";
import { ProjectsOverTimeChart } from "@/components/charts/projects-over-time-chart";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Rank 2,691 open-source climate and sustainability projects by nine metrics, track how the ecosystem has grown, and see the licences, languages and registries behind them.",
};

export default async function ProjectsPage() {
  // Every payload this page draws is fetched client-side by the chart that
  // needs it — loading them here serialised each one into the RSC stream on
  // every navigation, and the rankings and lifecycle files alone are ~1.7 MB
  // and ~1.4 MB. `filters` is 9 KB of controls and stays here.
  const filters = await loadFilters();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Project Analytics"
        description="Detailed insights into project rankings, lifecycle trends, and community attributes across the climate tech ecosystem."
      />

      <div className="stack">
        <Panel
          title="Project Rankings"
          description="Rank every tracked project by any of nine metrics, filtered by category and activity. Click a bar to open its repository."
        >
          <ProjectRankingsChart categories={filters.categories} />
        </Panel>

        <Panel
          title="Projects Over Time"
          description="Project age against sub-category, with each bubble sized by the metric you choose and colored by ecosystem category."
          notes="Age is measured from the first commit, so a repository migrated from elsewhere reads as younger than the work in it. Bubble area is scaled to the largest value currently shown, so it rescales when you change metric or category."
        >
          <ProjectsOverTimeChart
            categoryColors={filters.category_colors}
            categories={filters.categories}
          />
        </Panel>

        <Panel
          title="Recent Commit Activity"
          description="Whether each tracked project has recorded a commit in the last 365 days."
        >
          <CommitActivityChart />
        </Panel>

        <div className="two-column-grid">
          <Panel
            title="Code of Conduct"
            description="Projects publishing a code of conduct."
          >
            <CodeOfConductChart />
          </Panel>

          <Panel
            title="Contributing Guide"
            description="Projects publishing contribution guidelines."
          >
            <ContributingGuideChart />
          </Panel>
        </div>

        <Panel
          title="Languages"
          description="The primary language each repository reports."
        >
          <LanguagesChart />
        </Panel>

        <Panel
          title="Licenses"
          description="The license each repository declares, by SPDX identifier."
          notes="What the hosting platform detected, not a legal review. “Other” covers licences the detector could not match to an SPDX identifier."
        >
          <LicensesChart />
        </Panel>

        <Panel
          title="Package Ecosystems"
          description="The package registries these projects publish to."
          notes="Counts are registry entries, not projects: the source lists a registry once per package, so a project publishing several packages to PyPI is counted several times. An empty bucket produced by a trailing comma in the source data is excluded."
        >
          <EcosystemsChart />
        </Panel>

        <Panel
          title="Git Platforms"
          description="Where the repositories are hosted."
        >
          <PlatformsChart />
        </Panel>

      </div>
    </main>
  );
}
