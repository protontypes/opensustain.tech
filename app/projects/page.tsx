import { ProjectRankingsChart } from "@/components/charts/project-rankings-chart";
import { ProjectsOverTimeChart } from "@/components/charts/projects-over-time-chart";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters, loadProjectAttributes } from "@/lib/data";

export default async function ProjectsPage() {
  // The rankings and lifecycle payloads are ~1.7 MB and ~1.4 MB. Loading them
  // here serialised both into the RSC stream on every navigation; the charts
  // fetch them from /data instead, where they are cacheable static assets.
  const [filters, projectAttributes] = await Promise.all([
    loadFilters(),
    loadProjectAttributes(),
  ]);

  return (
    <main className="page-shell">
      <SectionHeading
        eyebrow="Projects"
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
          description="Project age against sub-category, with each bubble sized by the metric you choose and coloured by ecosystem category."
        >
          <ProjectsOverTimeChart
            categoryColors={filters.category_colors}
            categories={filters.categories}
          />
        </Panel>

        <Panel
          title="Attribute Snapshots"
          description="A summary of commit activity, programming languages, and software licenses across the tracked ecosystem."
        >
          <div className="three-column-grid">
            <div>
              <h3 className="mini-heading">Commit Activity</h3>
              <ul className="plain-list">
                {projectAttributes.commit_activity.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mini-heading">Top Languages</h3>
              <ul className="plain-list">
                {projectAttributes.fields.language.slice(0, 8).map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mini-heading">Top Licenses</h3>
              <ul className="plain-list">
                {projectAttributes.fields.license.slice(0, 8).map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
