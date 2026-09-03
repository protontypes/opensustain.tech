"use client";

import { useCallback } from "react";

import { communityDiscordUrl } from "@/lib/navigation";

export const COMMUNITY_BANNER_KEY = "community-banner-dismissed";

/**
 * The strip above the header, matching ClimateTriage's own invitation.
 *
 * Whether it shows is decided by the inline script in layout.tsx, which stamps
 * `community-dismissed` on <html> before first paint. Deciding it here in an
 * effect would either flash the bar at people who closed it or shift the whole
 * page down a frame after load; the theme toggle solves the same problem the
 * same way.
 */
export function CommunityBanner() {
  const dismiss = useCallback(() => {
    document.documentElement.classList.add("community-dismissed");
    try {
      localStorage.setItem(COMMUNITY_BANNER_KEY, "1");
    } catch {
      // It closes for this page view; it just will not stay closed.
    }
  }, []);

  return (
    <aside className="community-bar">
      <p className="community-bar__message">
        <i className="fa-solid fa-bullhorn" aria-hidden="true" />
        {/* One span, so the sentence keeps real word spaces and wraps inside
            itself; as bare text nodes each run becomes its own flex item. */}
        <span>
          Don&rsquo;t know where to start? Ask our{" "}
          <a href={communityDiscordUrl} target="_blank" rel="noreferrer">
            Community
          </a>
        </span>
      </p>
      <button
        type="button"
        className="community-bar__close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </aside>
  );
}
