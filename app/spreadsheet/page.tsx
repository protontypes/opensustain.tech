import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";
import { routes } from "@/lib/navigation";

// The old mkdocs nav's "Spreadsheet" tab (docs/spreadsheet.md) embedded the
// Grist database as an iframe. The embed is gone but the data is not: the
// methodology page links its CSV exports, which is what that link was for.
const DESTINATION = `${routes.methodology}#data`;

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINATION },
};

export default function SpreadsheetRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the data downloads on the methodology page"
      reason="The spreadsheet is no longer embedded here; its data is still downloadable."
    />
  );
}
