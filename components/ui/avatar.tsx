"use client";

import { useState } from "react";

/**
 * A project's or organisation's logo, with its initial behind it.
 *
 * The URLs point at third-party hosts — github.com for most, then a
 * scattering of self-hosted GitLabs — so any one of them can 404 or be
 * blocked. The initial sits underneath and shows whenever the image is
 * missing or fails, so a failed logo reads as a letter tile rather than an
 * empty grey box (or a broken-image glyph). Without a `name` there is nothing
 * to fall back to, and a missing image renders nothing.
 */
export function Avatar({
  src,
  size = 28,
  name,
  square = false,
}: {
  src: string | null | undefined;
  size?: number;
  /** The initial shown when there is no image, or it fails to load. */
  name?: string;
  /** Rounded square, for logos in rows and dialogs; circles for people and leaderboards. */
  square?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initial = name?.trim().charAt(0).toUpperCase();
  if (!showImage && !initial) return null;

  return (
    <span
      className={square ? "avatar avatar--square" : "avatar"}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initial ? (
        <span className="avatar__initial" style={{ fontSize: Math.round(size * 0.42) }}>
          {initial}
        </span>
      ) : null}
      {showImage ? (
        // Static export has no image optimizer to route this through.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}
