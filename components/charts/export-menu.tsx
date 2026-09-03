"use client";

import { useEffect, useRef, useState } from "react";

export type ExportFormat = "png" | "svg" | "csv";

/**
 * The export control, shared by every chart.
 *
 * It began inside the ecosystem sunburst's toolbar, which meant one chart of
 * nineteen could be exported. Nothing here is sunburst-specific; the caller
 * says which formats it can produce and what to do when one is chosen.
 */
export function ExportMenu({
  formats = ["png", "csv"],
  onExport,
  disabled,
  label = "Export",
}: {
  formats?: ExportFormat[];
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Stopped here so Escape closes the menu without also resetting the
      // chart's zoom, which listens on window.
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="viz-menu" ref={rootRef}>
      <button
        type="button"
        className="viz-button"
        aria-expanded={open}
        aria-haspopup="true"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open ? (
        <div className="viz-menu__list" role="group" aria-label="Export format">
          {formats.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                setOpen(false);
                onExport(format);
              }}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
