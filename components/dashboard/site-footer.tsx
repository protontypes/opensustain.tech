import Link from "next/link";

import { withBasePath } from "@/lib/base-path";
import type { Snapshot } from "@/lib/data/snapshot";
import { footerNavigation, socialLinks } from "@/lib/navigation";

export function SiteFooter({ snapshot }: { snapshot: Snapshot }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">
              <img
                className="footer-logo__mark"
                src={withBasePath("/images/logo.png")}
                alt=""
                width={200}
                height={200}
              />
              OpenSustain.Tech
            </span>
            <p className="footer-copyright">
              Data snapshot of{" "}
              <time dateTime={snapshot.iso}>{snapshot.label}</time>. Project
              metrics from{" "}
              <a href="https://ecosyste.ms/" target="_blank" rel="noreferrer">
                Ecosyste.ms
              </a>
              .
            </p>
            {/* The year comes from the data, not the visitor's clock. */}
            <p className="footer-copyright">
              © {snapshot.year} Open Sustainable Technology, published under{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
              .
            </p>
          </div>
          {footerNavigation.map((column) => (
            <nav
              key={column.heading}
              className="footer-column"
              aria-labelledby={`footer-${column.heading.toLowerCase()}`}
            >
              <p
                id={`footer-${column.heading.toLowerCase()}`}
                className="footer-column__heading"
              >
                {column.heading}
              </p>
              {column.links.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ))}
          <nav className="footer-column" aria-labelledby="footer-follow">
            <p id="footer-follow" className="footer-column__heading">
              Follow
            </p>
            {socialLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
