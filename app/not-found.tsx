import Link from "next/link";

import { routes } from "@/lib/navigation";

const quickLinks = [
  { href: routes.projects, label: "Projects" },
  { href: routes.analytics, label: "Analytics" },
  { href: routes.organizations, label: "Organizations" },
  { href: routes.topics, label: "Topics" },
];

export default function NotFound() {
  return (
    <main className="page-shell">
      <div className="section-heading">
        <p className="section-eyebrow">404</p>
        <h1>No such page</h1>
        <p className="section-description">
          One of these is probably what you were looking for.
        </p>
      </div>

      <div className="error-actions">
        {quickLinks.map((item) => (
          <Link key={item.href} className="viz-button" href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
