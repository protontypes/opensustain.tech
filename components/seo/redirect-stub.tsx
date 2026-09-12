type RedirectStubProps = {
  /** Where this URL now lives. Absolute (external) or root-relative. */
  to: string;
  /** What to call the destination in the visible copy, e.g. "the Projects directory". */
  destinationLabel: string;
  /** One line of context on why this page moved. */
  reason: string;
  external?: boolean;
};

/**
 * A stub for a URL that existed on the old mkdocs site (opensustain.tech,
 * pre-migration) and has no equivalent route on this one. Plain server
 * component — no JS needed for the redirect itself, so it still works with
 * scripts disabled, on a static export.
 *
 * The `<meta httpEquiv="refresh">` and `<link rel="canonical">` below are
 * ordinary elements returned from a nested component; React/Next hoist
 * `<title>`/`<meta>`/`<link>` into `<head>` no matter how deep they're
 * rendered from, so this doesn't need to run at the page/layout level.
 * Each page using this also sets `alternates.canonical` and `robots:
 * {index:false}` in its own `metadata` export — Next's metadata API emits
 * the canonical `<link>` itself, more reliably than a hand-rolled one, so
 * this component's job is just the visible fallback and the meta refresh.
 */
export function RedirectStub({
  to,
  destinationLabel,
  reason,
  external = false,
}: RedirectStubProps) {
  return (
    <main className="page-shell">
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <div className="section-heading">
        <p className="section-eyebrow">Moved</p>
        <h1>This page has moved</h1>
        <p className="section-description">
          {reason} Redirecting you to {destinationLabel}…
        </p>
      </div>
      <div className="error-actions">
        <a
          className="viz-button viz-button--primary"
          href={to}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          Continue to {destinationLabel}
        </a>
      </div>
    </main>
  );
}
