import { OrganizationRankingsChart } from "@/components/charts/organization-rankings-chart";
import { OrganizationSunburst } from "@/components/charts/sunburst/organization-sunburst";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  loadFilters,
  loadOrganizationRankings,
  loadOrganizationsBySubcategory,
  loadOrganizationsOverview,
} from "@/lib/data";

export default async function OrganizationsPage() {
  const [overview, rankings, organizationsBySubcategory, filters] =
    await Promise.all([
      loadOrganizationsOverview(),
      loadOrganizationRankings(),
      loadOrganizationsBySubcategory(),
      loadFilters(),
    ]);

  return (
    <main className="page-shell">
      <SectionHeading
        eyebrow="Organizations"
        title="Ecosystem Organizations"
        description="Analyze the geographic distribution, hierarchy, and sustainability impact of organizations contributing to open-source climate tech."
      />

      <div className="stack">
        <Panel
          title="Organization Rankings"
          description="Top organizations ranked by aggregated project score."
        >
          <OrganizationRankingsChart records={rankings.records} />
        </Panel>

        <Panel
          className="panel--viz"
          title="Projects by Organization"
          description="Organizations with two or more tracked projects. Each wedge takes the colour of the ecosystem category that organization works in most, sized by how many projects it maintains. Click one to open its projects."
        >
          <OrganizationSunburst categoryColors={filters.category_colors} />
        </Panel>

        <Panel
          title="Geography and Sub-category Summaries"
          description="A breakdown of top contributing countries, organization types, and technical sub-categories."
        >
          <div className="three-column-grid">
            <div>
              <h3 className="mini-heading">Top Countries</h3>
              <ul className="plain-list">
                {overview.countries.slice(0, 8).map((item) => (
                  <li key={item.iso_alpha}>
                    <span>{item.country_name}</span>
                    <strong>{item.organization_count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mini-heading">Organization Types</h3>
              <ul className="plain-list">
                {overview.organization_type_counts.slice(0, 8).map((item) => (
                  <li key={item.form_of_organization}>
                    <span>{item.form_of_organization}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mini-heading">Top Sub-categories</h3>
              <ul className="plain-list">
                {organizationsBySubcategory.subcategories.slice(0, 8).map((item) => (
                  <li key={item.sub_category}>
                    <span>{item.sub_category}</span>
                    <strong>{item.organization_count}</strong>
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
