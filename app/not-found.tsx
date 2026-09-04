import Link from "next/link";

import { primaryNavigation } from "@/lib/navigation";

export default function NotFound() {
  return (
    <main className="page-shell">
      <div className="section-heading">
        <p className="section-eyebrow">404</p>
        <h1>No such page</h1>
        <p className="section-description">
          There are four views of the ecosystem. One of these is probably what
          you were looking for.
        </p>
      </div>

      <div className="error-actions">
        {primaryNavigation.map((item) => (
          <Link key={item.href} className="viz-button" href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
