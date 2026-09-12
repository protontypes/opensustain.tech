import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";

// The old mkdocs nav's "Spreadsheet" tab (docs/spreadsheet.md) embedded the
// contributor-facing Grist database as an iframe. There's no equivalent
// widget on this site; the closest useful destination for anyone who
// followed that link is how to actually add or edit a project.
const DESTINATION =
  "https://github.com/protontypes/open-sustainable-technology/blob/main/CONTRIBUTING.md";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINATION },
};

export default function SpreadsheetRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the contributing guide on GitHub"
      reason="The project spreadsheet has been retired."
      external
    />
  );
}
