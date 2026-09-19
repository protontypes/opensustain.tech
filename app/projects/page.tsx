import type { Metadata } from "next";

import { ProjectDirectory } from "@/components/directory/project-directory";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadDirectory } from "@/lib/data/directory";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse the open-source ecosystem in climate change, sustainable energy, biodiversity and natural resources — every project from the OpenSustain.tech directory, searchable by name, description and category.",
};

export default async function ProjectsPage() {
  const directory = await loadDirectory();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Project Directory"
        description={`${formatNumber(directory.totals.projects)} open-source projects across ${directory.totals.categories} categories and ${directory.totals.subcategories} subcategories; climate change, sustainable energy, biodiversity and natural resources.`}
      />
      <ProjectDirectory />
    </main>
  );
}
