import type { Metadata } from "next";

import { OrganizationFiltersProvider } from "@/components/charts/organization-filters";
import { OrganizationRankingsChart } from "@/components/charts/organization-rankings-chart";
import {
  ContinentsChart,
  OrganizationTypesChart,
  TopCountriesChart,
  TopOrganizationsChart,
} from "@/components/charts/organizations-distribution-charts";
import { OrganizationsMap } from "@/components/charts/organizations-map";
import { OrganizationSunburst } from "@/components/charts/sunburst/organization-sunburst";
import { SubcategorySunburst } from "@/components/charts/sunburst/subcategory-sunburst";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters } from "@/lib/data";

export const metadata: Metadata = {
  title: "Organizations",
  description:
    "The 1,274 organizations building open-source climate tech: where they are, what kind they are, which sub-categories they work in, and what they maintain.",
};

export default async function OrganizationsPage() {
  // Every payload on this page is fetched client-side by the chart that needs
  // it — crossing one into a client component serialises the whole thing into
  // the RSC stream. `filters` is 9 KB of controls and stays here.
  const filters = await loadFilters();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        eyebrow="Organizations"
        title="Ecosystem Organizations"
        description="Analyze the geographic distribution, hierarchy, and sustainability impact of organizations contributing to open-source climate tech."
      />

      <OrganizationFiltersProvider>
      <div className="stack">
        <Panel
          title="Organization Rankings"
          description="Organizations ranked by the combined score of the projects they maintain. Filter to a category to rank by that category’s score alone; each bar takes the color of the category the organization scores highest in."
        >
          <OrganizationRankingsChart
            categories={filters.categories}
            categoryColors={filters.category_colors}
          />
        </Panel>

        <Panel
          className="panel--viz"
          title="Projects by Organization"
          description="Each wedge takes the color of the ecosystem category that organization works in most, sized by how many projects it maintains. Click one to open its projects."
        >
          <OrganizationSunburst categoryColors={filters.category_colors} />
        </Panel>

        <Panel
          className="panel--viz"
          title="Organizations by Sub-Category"
          description="The 81 technical sub-categories, sized by how many organizations work in each and colored by their parent ecosystem category. Click a sub-category to see the organizations behind it, and filter by country or organization type."
        >
          <SubcategorySunburst
            categoryColors={filters.category_colors}
            subCategoriesByCategory={filters.sub_categories_by_category}
          />
        </Panel>

        <Panel
          className="panel--viz"
          title="Where the Organizations Are"
          description="Every organization behind these projects, by the country it records. Shade the map by projects or by organizations; countries are joined on their ISO 3166-1 alpha-3 code."
          notes="Projects have no country of their own; this is where the organization behind them is based, and 102 of those give no location at all. Singapore is drawn from its own bounding box, which the map's source omits at this scale."
        >
          <OrganizationsMap />
        </Panel>

        <Panel
          title="Top Organizations by Projects"
          description="Organizations ranked by how many tracked projects they list, not by score. Click a bar to open the organization."
        >
          <TopOrganizationsChart />
        </Panel>

        <Panel
          title="Top Countries by Organizations"
          description="How many organizations record each country as their location."
        >
          <TopCountriesChart />
        </Panel>

        <div className="two-column-grid">
          <Panel
            title="Organizations by Continent"
            description="The same organizations, grouped by continent."
          >
            <ContinentsChart />
          </Panel>

          <Panel
            title="Organizations by Type"
            description="Academia, community, government and the rest, as each organization describes itself."
            notes="Self-reported. “Unknown” is the 101 organizations that record no type."
          >
            <OrganizationTypesChart />
          </Panel>
        </div>
      </div>
      </OrganizationFiltersProvider>
    </main>
  );
}
