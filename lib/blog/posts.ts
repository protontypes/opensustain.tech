import { readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

/**
 * The OpenSustain.tech blog, migrated from the old mkdocs site's
 * docs/blog/*.md. Source markdown (frontmatter + body) lives in
 * content/blog/<slug>.md; referenced images were copied to
 * public/images/blog/<slug>/.
 */

export type BlogAuthorIcon = "linkedin" | "twitter" | "mastodon" | "github";

export type BlogAuthor = {
  name: string;
  url?: string;
  icon?: BlogAuthorIcon;
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  /** ISO date, e.g. "2024-06-14". */
  date: string;
  authors: BlogAuthor[];
  excerpt: string;
  /** Absolute path under /images/blog/... or an external https URL. */
  image?: string;
};

export type BlogPost = BlogPostMeta & {
  /** Body markdown, already rendered to HTML (raw embedded HTML preserved). */
  html: string;
};

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Post order, newest first — mirrors the manual ordering of the old
 * mkdocs.yml Blog nav. This is NOT the same as sorting by date: e.g. in
 * 2022 the nav lists "You can preserve..." (May 23) before "Impact and
 * potential..." (Jan 17), which is itself listed before "Openness as a key
 * indicator..." (Jan 29) — a date sort would put the two January posts in
 * the opposite order. Keeping an explicit list reproduces the old site's
 * URLs *and* its reading order exactly.
 */
const POST_ORDER = [
  "introducing_openSustain_analytics",
  "climatetriage-relaunch",
  "openclimatefund",
  "closing-the-gap",
  "sustain-open-source",
  "launch_climate_triage",
  "the_open_source_sustainability_ecosystem",
  "you_can_preserve_the_earth_s_livability_with_open_source",
  "impact_and_potential_of_open_source_on_climate_technology",
  "openness_as_a_key_indicator_for_sustainable_investment",
  "open_principles_for_a_sustainable_technology_transition",
  "gathering_open_sustainable_technology",
] as const;

export type BlogSlug = (typeof POST_ORDER)[number];

export function blogSlugs(): BlogSlug[] {
  return [...POST_ORDER];
}

async function renderMarkdown(content: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    // sanitize: false lets embedded raw HTML (the mkdocs <figure> blocks and
    // Flourish/ourworldindata <iframe> embeds converted into these posts)
    // pass through instead of being stripped.
    .use(remarkHtml, { sanitize: false })
    .process(content);
  return processed.toString();
}

async function readPost(slug: string): Promise<BlogPost> {
  const raw = await readFile(path.join(POSTS_DIR, `${slug}.md`), "utf-8");
  const { data, content } = matter(raw);
  const html = await renderMarkdown(content);

  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    authors: (data.authors as BlogAuthor[] | undefined) ?? [],
    excerpt: (data.excerpt as string | undefined) ?? "",
    image: data.image as string | undefined,
    html,
  };
}

/** Every post, newest first (POST_ORDER order). */
export async function loadAllPosts(): Promise<BlogPost[]> {
  return Promise.all(POST_ORDER.map((slug) => readPost(slug)));
}

/** One post by slug, or undefined for anything outside POST_ORDER. */
export async function loadPost(slug: string): Promise<BlogPost | undefined> {
  if (!(POST_ORDER as readonly string[]).includes(slug)) return undefined;
  return readPost(slug);
}

/** The year a post's ISO date falls in, read as UTC so it never shifts with the server's local timezone. */
export function postYear(post: BlogPostMeta): number {
  return new Date(post.date).getUTCFullYear();
}

/** Posts grouped by year, years descending; posts keep POST_ORDER within a year. */
export function groupByYear<T extends BlogPostMeta>(posts: T[]): Array<[number, T[]]> {
  const byYear = new Map<number, T[]>();
  for (const post of posts) {
    const year = postYear(post);
    const group = byYear.get(year);
    if (group) {
      group.push(post);
    } else {
      byYear.set(year, [post]);
    }
  }
  return [...byYear.entries()].sort(([a], [b]) => b - a);
}
