import type { ReactNode } from "react";
import type { Metadata } from "next";

import { CommunityBanner } from "@/components/dashboard/community-banner";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { loadSnapshot } from "@/lib/data/snapshot";
import { SITE_URL } from "@/lib/seo/site";

import "./globals.css";

// Adapted from open-sustainable-technology/docs/meta_tags.md, the mkdocs
// site's own description and social-preview image.
const SITE_DESCRIPTION =
  "Open technology projects sustaining stable climate, energy supply, biodiversity and vital natural resources.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Every route shared one title on the old analytics-only app, so four
  // different pages were indistinguishable in a tab strip, in browser
  // history and in a shared link. Kept per-route here too.
  title: {
    default: "Open Sustainable Technology",
    template: "%s · Open Sustainable Technology",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Open Sustainable Technology",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Open Sustainable Technology",
    images: ["/images/earth.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Sustainable Technology",
    description: SITE_DESCRIPTION,
    images: ["/images/earth.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const snapshot = await loadSnapshot();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400..700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                  if (localStorage.getItem('community-banner-dismissed')) {
                    document.documentElement.classList.add('community-dismissed');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/*
          Umami, same site ID mkdocs used (docs/overrides/main.html), gated
          the same way that override gated it — config.extra.analytics.
          production_url in config.site_url — so a localhost/preview/staging
          copy of this static export never reports as opensustain.tech
          traffic. A build-time env check can't do this: `next build`
          freezes one static output that could get served from any host.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.location.hostname !== 'opensustain.tech') return;
                var s = document.createElement('script');
                s.defer = true;
                s.src = 'https://cloud.umami.is/script.js';
                s.setAttribute('data-website-id', '6c3cf2c8-549d-4add-b7dc-5f25fd17c90b');
                document.head.appendChild(s);
              })();
            `,
          }}
        />
      </head>
      <body>
        {/* First in the tab order, so keyboard and screen-reader users can
            jump past the banner and the header's nine stops. */}
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <CommunityBanner />
        <SiteHeader />
        <div className="site-content" id="content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter snapshot={snapshot} />
      </body>
    </html>
  );
}
