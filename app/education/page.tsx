import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";
import { SITE_URL } from "@/lib/seo/site";

// The old mkdocs nav's "Education" tab (education.md) was a curated list of
// learning resources. That list now lives as the directory's own "Education"
// subcategory, under "Sustainable Development" — see DATA_CONTRACT.md and
// public/data/filters.json's `sub_categories_by_category`.
const DESTINATION = "/projects?category=Sustainable+Development&subcategory=Education";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}${DESTINATION}` },
};

export default function EducationRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the Education subcategory in the Projects directory"
      reason="Education resources are now part of the project directory."
    />
  );
}
