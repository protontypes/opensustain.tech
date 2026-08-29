import { ProjectRankingsChart } from "@/components/charts/project-rankings-chart";
import { ProjectsOverTimeChart } from "@/components/charts/projects-over-time-chart";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters, loadProjectAttributes, loadProjectRankings, loadProjectsOverTime } from "@/lib/data";

export default async function ProjectsPage() {
  const [filters, rankings, projectsOverTime, projectAttributes] =
    await Promise.all([
      loadFilters(),
      loadProjectRankings(),
      loadProjectsOverTime(),
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
          description="The highest-performing projects ranked by their combined health, activity, and community score."
        >
          <ProjectRankingsChart records={rankings.records} />
        </Panel>

        <Panel
          title="Projects Over Time"
          description="An overview of project lifecycles, mapped by sub-category and scaled by contributor volume."
        >
          <ProjectsOverTimeChart
            records={projectsOverTime.records}
            categoryColors={filters.category_colors}
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
