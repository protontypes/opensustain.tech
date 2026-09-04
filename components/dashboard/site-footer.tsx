import Link from "next/link";

import type { Snapshot } from "@/lib/data/snapshot";

export function SiteFooter({ snapshot }: { snapshot: Snapshot }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">
              <img
                className="footer-logo__mark"
                src="/images/logo.png"
                alt=""
                width={200}
                height={200}
              />
              OpenSustain.Analytics
            </span>
            {/* The year comes from the data, not the visitor's clock. */}
            <p className="footer-copyright">
              © {snapshot.year} OpenSustain.tech ·{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
            </p>
            <p className="footer-copyright">
              Data snapshot of{" "}
              <time dateTime={snapshot.iso}>{snapshot.label}</time>. Project
              metrics from{" "}
              <a href="https://ecosyste.ms/" target="_blank" rel="noreferrer">
                Ecosyste.ms
              </a>
              .
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <Link href="/">Overview</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/organizations">Organizations</Link>
            <Link href="/topics">Topics</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
