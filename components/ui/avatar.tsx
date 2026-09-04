"use client";

import { useState } from "react";

/**
 * A project's or organisation's logo.
 *
 * `avatar_url` is populated on 2,571 of 2,691 project records and was rendered
 * nowhere. The URLs point at third-party hosts — github.com for 2,539 of them,
 * then a scattering of self-hosted GitLabs — so any one of them can 404 or be
 * blocked; a broken-image glyph in a leaderboard is worse than no image, hence
 * the client-side error state.
 */
export function Avatar({
  src,
  size = 28,
}: {
  src: string | null | undefined;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <img
      className="avatar"
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
    />
  );
}
