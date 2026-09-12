import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";

// The old mkdocs site's docs/open_source_in_environmental_sustainability.md
// was a bare iframe wrapper around an external report; send readers straight
// to what that iframe pointed at instead of an equivalent that doesn't exist
// on this site.
const DESTINATION = "https://report.opensustain.tech/chapters/index.html";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINATION },
};

export default function ReportRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the full report"
      reason="This page only ever embedded that report."
      external
    />
  );
}
