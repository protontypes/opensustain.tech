import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";

// The old mkdocs site's docs/how_to_identify_projects.md had no site page of
// its own to move to; the source document is what's authoritative anyway.
const DESTINATION =
  "https://github.com/protontypes/open-sustainable-technology/blob/main/docs/how_to_identify_projects.md";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINATION },
};

export default function HowToIdentifyProjectsRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the guidelines document on GitHub"
      reason="This guide now lives only in the repository."
      external
    />
  );
}
