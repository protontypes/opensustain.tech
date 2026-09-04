import type { PropsWithChildren, ReactNode } from "react";

type PanelProps = PropsWithChildren<{
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  /**
   * Panels sit under the route's h1, so their titles are h2 by default. A
   * panel nested inside another section can drop to h3.
   */
  titleAs?: "h2" | "h3";
  /**
   * What a reader has to know to read this chart honestly — a caveat, a
   * coverage limit, a counting rule. Rendered under the chart, where
   * Datawrapper and Our World in Data both put it, rather than in the
   * description above it, which is read before the chart makes sense.
   */
  notes?: ReactNode;
  /** Where the numbers came from. */
  source?: ReactNode;
}>;

export function Panel({
  title,
  description,
  className,
  titleAs: Title = "h2",
  notes,
  source,
  children,
}: PanelProps) {
  return (
    <section className={["panel", className].filter(Boolean).join(" ")}>
      {(title || description) && (
        <header className="panel-header">
          {title ? <Title className="panel-title">{title}</Title> : null}
          {description ? <p className="panel-description">{description}</p> : null}
        </header>
      )}
      {children}

      {notes || source ? (
        <footer className="panel-footer">
          {notes ? <p className="panel-footer__notes">{notes}</p> : null}
          {source ? <p className="panel-footer__source">{source}</p> : null}
        </footer>
      ) : null}
    </section>
  );
}
