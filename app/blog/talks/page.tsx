import type { Metadata } from "next";

import { MediaTabs } from "@/components/media/media-tabs";
import { SectionHeading } from "@/components/ui/section-heading";
import { MEDIA_DESCRIPTION } from "@/lib/navigation";
import { presentations } from "@/lib/presentations";

import "./presentations.css";

export const metadata: Metadata = {
  title: "Talks",
  description:
    "Talks and conference appearances where Open Sustainable Technology has shown the contribution of open source to environmental sustainability.",
};

export default function TalksPage() {
  return (
    <main className="page-shell">
      <SectionHeading as="h1" title="Media" description={MEDIA_DESCRIPTION} />
      <MediaTabs active="talks" />

      <ul className="presentations-grid">
        {presentations.map((presentation) => (
          <li key={presentation.url}>
            <a
              className="panel presentation-card"
              href={presentation.url}
              target="_blank"
              rel="noreferrer"
            >
              <div
                className={
                  presentation.thumbnailUrl
                    ? "presentation-card__thumb"
                    : "presentation-card__thumb presentation-card__thumb--placeholder"
                }
              >
                {presentation.thumbnailUrl ? (
                  <>
                    <img
                      src={presentation.thumbnailUrl}
                      alt=""
                      loading="lazy"
                    />
                    <span className="presentation-card__play" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="#ffffff">
                        <circle
                          cx="12"
                          cy="12"
                          r="11"
                          className="presentation-card__play-bg"
                        />
                        <path d="M10 8.2v7.6c0 .55.6.9 1.08.62l6.3-3.8a.72.72 0 0 0 0-1.24l-6.3-3.8A.72.72 0 0 0 10 8.2Z" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 10.5 21 3m0 0h-5.5M21 3v5.5M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                    />
                  </svg>
                )}
              </div>

              <p className="presentation-card__meta">
                {presentation.event} · {presentation.year}
              </p>
              <h3 className="presentation-card__title">{presentation.title}</h3>

              <span className="inline-link presentation-card__cta">
                {presentation.youtubeId ? "Watch the talk" : "View details"}
                {" ↗"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
