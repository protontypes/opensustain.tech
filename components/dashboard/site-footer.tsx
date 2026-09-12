import Link from "next/link";

import type { Snapshot } from "@/lib/data/snapshot";
import { footerNavigation, routes, socialLinks } from "@/lib/navigation";

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
              OpenSustain.Tech
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
              </a>{" "}
              · <Link href={routes.privacyPolicy}>Privacy Policy</Link>
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
            <nav className="footer-social" aria-label="Social">
              {socialLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            {footerNavigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
