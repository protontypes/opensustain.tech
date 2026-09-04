"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary.
 *
 * Without one, any render-time throw in a chart replaces the whole page with
 * Next's exception screen — and every chart on this site parses a third-party
 * JSON snapshot at runtime, so a shape change upstream is a real way to get
 * here.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <p className="section-eyebrow">Something broke</p>
        <h1>This page could not be drawn</h1>
        <p className="section-description">
          The charts on this page read a data snapshot that is regenerated
          nightly. If it changed shape, this is what you get. Nothing you did
          caused it.
        </p>
      </div>

      <div className="error-actions">
        <button type="button" className="viz-button viz-button--primary" onClick={reset}>
          Try again
        </button>
        <Link className="viz-button" href="/">
          Go to the overview
        </Link>
      </div>

      {error.digest ? (
        <p className="panel-footnote">Reference: {error.digest}</p>
      ) : null}
    </main>
  );
}
