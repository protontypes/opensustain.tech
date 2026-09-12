import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";
import { SITE_URL } from "@/lib/seo/site";

// The old mkdocs site's docs/grist_spreadsheet_metadata.md defined what each
// dataset column means. The Methodology page now covers that ground (data
// sources, metric definitions, coverage) for this site's data.
const DESTINATION = "/methodology";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}${DESTINATION}` },
};

export default function GristMetadataRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the Methodology page"
      reason="Dataset column definitions now live with the rest of the methodology."
    />
  );
}
