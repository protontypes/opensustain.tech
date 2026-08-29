import type { PropsWithChildren, ReactNode } from "react";

type PanelProps = PropsWithChildren<{
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}>;

export function Panel({ title, description, className, children }: PanelProps) {
  return (
    <section className={["panel", className].filter(Boolean).join(" ")}>
      {(title || description) && (
        <header className="panel-header">
          {title ? <div className="panel-title">{title}</div> : null}
          {description ? <p className="panel-description">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}
