import type { ReactNode } from "react";
import type { Metadata } from "next";

import { CommunityBanner } from "@/components/dashboard/community-banner";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { loadSnapshot } from "@/lib/data/snapshot";

import "./globals.css";

export const metadata: Metadata = {
  // Every route shared one title, so four different pages were indistinguishable
  // in a tab strip, in browser history and in a shared link.
  title: {
    default: "OpenSustain Analytics",
    template: "%s · OpenSustain Analytics",
  },
  description:
    "Visualizing the open-source sustainability ecosystem. Insights into project health, community engagement, and technological trends in climate-tech.",
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
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
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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
      </head>
      <body>
        <CommunityBanner />
        <SiteHeader />
        <div className="site-content">
          {children}
        </div>
        <SiteFooter snapshot={snapshot} />
      </body>
    </html>
  );
}
