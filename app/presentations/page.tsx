import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";
import { routes } from "@/lib/navigation";

// Presentations had their own header entry until they moved under Media as
// the Talks tab, next to articles. This keeps the old mkdocs-era URL, and
// any link to this site's own /presentations page, landing on the talks.
const DESTINATION = `${routes.talks}/`;

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINATION },
};

export default function PresentationsRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="Talks"
      reason="Presentations now live under Media, alongside articles."
    />
  );
}
