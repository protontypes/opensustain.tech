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
}>;

export function Panel({
  title,
  description,
  className,
  titleAs: Title = "h2",
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
    </section>
  );
}
