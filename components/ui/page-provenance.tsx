import Link from "next/link";
import type { ReactNode } from "react";

import { snapshotOf } from "@/lib/data/snapshot";
import { routes } from "@/lib/navigation";
import type { SiteTotals } from "@/lib/types/site";

/**
 * Which snapshot a page's numbers come from, under its title. Two dates,
 * because there are two sources: the project list is read from the README on
 * every build (`generated_at`), while the metrics come from the analytics
 * payloads, which republish on their own schedule (`as_of`). A page shows the
 * one its numbers rest on, or both.
 */
export function PageProvenance({
  totals,
  show = "both",
  className,
  children,
}: {
  totals: SiteTotals;
  show?: "list" | "metrics" | "both";
  className?: string;
  /** Anything else that belongs on the line, such as a download link. */
  children?: ReactNode;
}) {
  const list = snapshotOf(totals.generated_at);
  const metrics = snapshotOf(totals.as_of);

  return (
    <p className={["page-provenance", className].filter(Boolean).join(" ")}>
      {show !== "metrics" ? (
        <>
          Project list read <time dateTime={list.iso}>{list.label}</time>
        </>
      ) : null}
      {show === "both" ? " · " : null}
      {show !== "list" ? (
        <>
          {show === "both" ? "metrics" : "Metrics"} as of{" "}
          <time dateTime={metrics.iso}>{metrics.label}</time>
        </>
      ) : null}
      . <Link href={routes.methodology}>How this is measured</Link>
      {children}
    </p>
  );
}
