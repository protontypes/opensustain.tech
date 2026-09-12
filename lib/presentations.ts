/**
 * Talks and conference appearances, for the /presentations route.
 *
 * Source of truth: open-sustainable-technology/docs/presentations.md (a
 * sibling checkout, not part of this repo, so it isn't available at build
 * time on every machine or in CI). Rather than reaching outside the repo at
 * build time — which would make the static export non-reproducible whenever
 * that sibling checkout is missing or has moved on — the markdown's list is
 * copied here verbatim (re-verified against the source file) and parsed with
 * the same "- [title](link) - event - year" grammar the source file uses, so
 * updating this list is still a plain content edit, not a rewrite of markup.
 */

const PRESENTATIONS_MARKDOWN = `
- [Mapping the Open Source Ecosystem for Climate Science and Sustainable Technology](https://youtu.be/mVNHdsaEZCw?si=1BIVU-2z8GE8G3da) - OpenForum Europe - 2025
- [Disrupting the destruction of our natural world with openness](https://fosdem.org/2025/schedule/event/fosdem-2025-5972-disrupting-the-destruction-of-our-natural-world-with-openness/) - FOSDEM - 2025
- [Hacking Earth from Space with Open Source](https://www.youtube.com/watch?v=8NP2iTaWIoc) - Major League Hacking - 2024
- [How are open source projects creating climate impact?](https://www.youtube.com/watch?v=6aEFLPXT6l8) - Community Panel hosted by Open Climate Fix - 2024
- [Innovation für die Tonne? Nachhaltigkeit durch Open Source](https://www.youtube.com/watch?v=P9xa-qPPh58) - Science Slam - 2023
- [Open Source in Environmental Sustainability](https://www.youtube.com/watch?v=AW1ZvjSwV0I) - State of Open Con - 2023
- [Open Source in Environmental Sustainability](https://archive.fosdem.org/2023/schedule/event/sustainability/) - FOSDEM - 2023
- [Huddle: The Untapped Potential of Open Source Culture in the Fight Against Climate Change](https://www.youtube.com/watch?v=_c9twDNB144) - Terrado Climate School - 2022
- [Measuring the Open and Sustainable Technology World](https://www.youtube.com/watch?v=uTbj70jb2hU) - LF Energy Spring Summit - 2021
`;

export type Presentation = {
  title: string;
  url: string;
  event: string;
  year: number;
  /** Set only when `url` is a youtube.com/youtu.be link. */
  youtubeId: string | null;
  /** `img.youtube.com/vi/<id>/hqdefault.jpg`, when `youtubeId` is set. */
  thumbnailUrl: string | null;
};

/**
 * Pulls a YouTube video id out of either link shape the source list uses:
 * `youtu.be/<id>` (with an optional `?si=` share param) and
 * `youtube.com/watch?v=<id>`. Anything else — FOSDEM's own schedule pages —
 * returns null, which is the signal to render no thumbnail.
 */
export function extractYoutubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return parsed.pathname.slice(1).split("/")[0] || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    return parsed.searchParams.get("v");
  }
  return null;
}

const LIST_ITEM_PATTERN =
  /^-\s*\[(.+?)\]\((\S+?)\)\s*-\s*(.+?)\s*-\s*(\d{4})\s*$/;

function parsePresentationsMarkdown(markdown: string): Presentation[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => {
      const match = LIST_ITEM_PATTERN.exec(line);
      if (!match) {
        throw new Error(`presentations.ts: could not parse line: "${line}"`);
      }
      const [, title, url, event, year] = match;
      const youtubeId = extractYoutubeId(url);
      return {
        title,
        url,
        event,
        year: Number(year),
        youtubeId,
        thumbnailUrl: youtubeId
          ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
          : null,
      };
    });
}

/** Newest first — the order the source markdown already lists them in. */
export const presentations: Presentation[] = parsePresentationsMarkdown(
  PRESENTATIONS_MARKDOWN,
);
