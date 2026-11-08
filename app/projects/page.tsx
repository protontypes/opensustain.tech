import type { Metadata } from "next";

import { ProjectDirectory } from "@/components/directory/project-directory";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadSiteTotals } from "@/lib/data/site";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse the open-source ecosystem in climate change, sustainable energy, biodiversity and natural resources — every project from the OpenSustain.tech directory, searchable by name, description and category.",
};

export default async function ProjectsPage() {
  const totals = await loadSiteTotals();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Project Directory"
        description={`${formatNumber(totals.projects)} open-source projects across ${totals.categories} categories and ${totals.subcategories} subcategories; climate change, sustainable energy, biodiversity and natural resources.`}
      />
      <ProjectDirectory />
    </main>
  );
}
