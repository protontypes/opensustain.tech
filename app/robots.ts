import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/site";

// Required for a route handler under `output: "export"` — there's no
// request to serve this dynamically at, so it has to be resolvable at
// build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
