import { OrganizationRankingsChart } from "@/components/charts/organization-rankings-chart";
import { OrganizationSunburst } from "@/components/charts/sunburst/organization-sunburst";
import { SubcategorySunburst } from "@/components/charts/sunburst/subcategory-sunburst";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters, loadOrganizationsOverview } from "@/lib/data";

export default async function OrganizationsPage() {
  // organization-rankings (~835 KB) and organizations-by-subcategory (~670 KB)
  // are fetched client-side by their charts; crossing them into a client
  // component would serialise the whole payload into the RSC stream. Only the
  // overview, which feeds server-rendered lists, is loaded here.
  const [overview, filters] = await Promise.all([
    loadOrganizationsOverview(),
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
          description="Organizations ranked by the combined score of the projects they maintain. Filter to a category to rank by that category’s score alone; each bar takes the colour of the category the organization scores highest in."
        >
          <OrganizationRankingsChart
            categories={filters.categories}
            categoryColors={filters.category_colors}
          />
        </Panel>

        <Panel
          className="panel--viz"
          title="Projects by Organization"
          description="Organizations with two or more tracked projects. Each wedge takes the colour of the ecosystem category that organization works in most, sized by how many projects it maintains. Click one to open its projects."
        >
          <OrganizationSunburst categoryColors={filters.category_colors} />
        </Panel>

        <Panel
          className="panel--viz"
          title="Organizations by Sub-Category"
          description="The 81 technical sub-categories, sized by how many organizations work in each and coloured by their parent ecosystem category. Click a sub-category to see the organizations behind it, and filter by country or organization type."
        >
          <SubcategorySunburst
            categoryColors={filters.category_colors}
            subCategoriesByCategory={filters.sub_categories_by_category}
          />
        </Panel>

        <Panel
          title="Geography and Organization Types"
          description="A breakdown of the top contributing countries and the kinds of organization behind them."
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
          </div>
        </Panel>
      </div>
    </main>
  );
}
