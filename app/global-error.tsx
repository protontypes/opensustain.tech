"use client";

/**
 * The last resort: a throw in the root layout itself, which route-level
 * error.tsx cannot catch. It replaces <html>, so it carries no app styling and
 * must not depend on globals.css having loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#ffffff",
          color: "#101620",
        }}
      >
        <div style={{ maxWidth: "42ch", padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>
            OpenSustain Analytics could not start
          </h1>
          <p style={{ margin: "0 0 24px", lineHeight: 1.6, color: "#4e6a9a" }}>
            Something failed before the page could render.
            {error.digest ? ` Reference: ${error.digest}.` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              font: "inherit",
              padding: "10px 20px",
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
