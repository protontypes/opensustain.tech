import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";

// The old mkdocs nav's "Contribute" tab (docs/contributing.md) was a
// build-time copy of the repo's own CONTRIBUTING.md. Rather than maintain a
// second copy on this site, send readers to the source document.
const DESTINATION =
  "https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINATION },
};

export default function ContributingRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="CONTRIBUTING.md on GitHub"
      reason="This page was a copy of the contributing guide."
      external
    />
  );
}
