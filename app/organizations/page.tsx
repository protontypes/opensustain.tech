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
import { PageIndex } from "@/components/ui/page-index";
import { PageProvenance } from "@/components/ui/page-provenance";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadFilters } from "@/lib/data";
import {
  countOrganizationsWithoutLocation,
  countOrganizationsWithoutType,
} from "@/lib/data/methodology";
import { loadSiteTotals } from "@/lib/data/site";
import { formatNumber } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const totals = await loadSiteTotals();
  return {
    title: "Organizations",
    description: `The ${formatNumber(totals.organizations)} organizations building open-source climate tech: where they are, what kind they are, which sub-categories they work in, and what they maintain.`,
  };
}

export default async function OrganizationsPage() {
  // Every payload on this page is fetched client-side by the chart that needs
  // it — crossing one into a client component serialises the whole thing into
  // the RSC stream. `filters` is 9 KB of controls and stays here.
  const [filters, withoutLocation, withoutType, totals] = await Promise.all([
    loadFilters(),
    countOrganizationsWithoutLocation(),
    countOrganizationsWithoutType(),
    loadSiteTotals(),
  ]);

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Ecosystem Organizations"
        description="Where the organizations behind open-source climate tech are based, what kind of organizations they are, and which projects and sub-categories they maintain."
      />
      <PageProvenance totals={totals} show="metrics" />
      <PageIndex
        items={[
          { id: "organization-rankings", label: "Organization Rankings" },
          { id: "projects-by-organization", label: "Projects by Organization" },
          { id: "organizations-by-sub-category", label: "Organizations by Sub-Category" },
          { id: "where-the-organizations-are", label: "Where the Organizations Are" },
          { id: "top-organizations-by-projects", label: "Top Organizations by Projects" },
          { id: "top-countries-by-organizations", label: "Top Countries by Organizations" },
          { id: "organizations-by-continent", label: "Organizations by Continent" },
          { id: "organizations-by-type", label: "Organizations by Type" },
        ]}
      />

      <OrganizationFiltersProvider>
      <div className="stack">
        <Panel
          id="organization-rankings"
          title="Organization Rankings"
          description="Organizations ranked by the combined score of the projects they maintain. Filter to a category to rank by that category’s score alone; each bar takes the color of the category the organization scores highest in."
          notes="Scores are computed by Ecosyste.ms from public activity data, not judged by the maintainers. A high rank is not an endorsement."
        >
          <OrganizationRankingsChart
            categories={filters.categories}
            categoryColors={filters.category_colors}
          />
        </Panel>

        <Panel
          className="panel--viz"
          id="projects-by-organization"
          title="Projects by Organization"
          description="Each wedge takes the color of the ecosystem category that organization works in most, sized by how many projects it maintains. Click one to open its projects."
        >
          <OrganizationSunburst categoryColors={filters.category_colors} />
        </Panel>

        <Panel
          className="panel--viz"
          id="organizations-by-sub-category"
          title="Organizations by Sub-Category"
          description="Every technical sub-category, plus Education, sized by how many organizations work in each and colored by their parent ecosystem category. Click a sub-category to see the organizations behind it, and filter by country or organization type."
        >
          <SubcategorySunburst
            categoryColors={filters.category_colors}
            subCategoriesByCategory={filters.sub_categories_by_category}
          />
        </Panel>

        <Panel
          className="panel--viz"
          id="where-the-organizations-are"
          title="Where the Organizations Are"
          description="Every organization behind these projects, by the country it records. Shade the map by projects or by organizations; countries are joined on their ISO 3166-1 alpha-3 code."
          notes={`Projects have no country of their own; this is where the organization behind them is based, and ${formatNumber(withoutLocation)} of those give no location at all. Singapore is drawn from its own bounding box, which the map's source omits at this scale.`}
        >
          <OrganizationsMap />
        </Panel>

        <Panel
          id="top-organizations-by-projects"
          title="Top Organizations by Projects"
          description="Organizations ranked by how many tracked projects they list, not by score. Click a bar to open the organization."
        >
          <TopOrganizationsChart />
        </Panel>

        <Panel
          id="top-countries-by-organizations"
          title="Top Countries by Organizations"
          description="How many organizations record each country as their location."
        >
          <TopCountriesChart />
        </Panel>

        <div className="two-column-grid">
          <Panel
            id="organizations-by-continent"
            title="Organizations by Continent"
            description="The same organizations, grouped by continent."
          >
            <ContinentsChart />
          </Panel>

          <Panel
            id="organizations-by-type"
            title="Organizations by Type"
            description="Academia, community, government and the rest, as each organization describes itself."
            notes={`Self-reported. “Unknown” is the ${formatNumber(withoutType)} organizations that record no type.`}
          >
            <OrganizationTypesChart />
          </Panel>
        </div>
      </div>
      </OrganizationFiltersProvider>
    </main>
  );
}
