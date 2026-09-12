import type { Metadata } from "next";

import { RedirectStub } from "@/components/seo/redirect-stub";
import { SITE_URL } from "@/lib/seo/site";

// The old mkdocs site's docs/meta_tags.md was never a real page — its
// front matter was prepended into index.md's build to supply Open Graph
// tags for the homepage. Nothing else on the old site linked to it as
// content, so this just goes home.
const DESTINATION = "/";

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}${DESTINATION}` },
};

export default function MetaTagsRedirectPage() {
  return (
    <RedirectStub
      to={DESTINATION}
      destinationLabel="the homepage"
      reason="This was a build-time fragment, not a page."
    />
  );
}
