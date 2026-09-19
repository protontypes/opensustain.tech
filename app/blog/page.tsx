import type { Metadata } from "next";
import Link from "next/link";

import { PostAuthors } from "@/components/blog/post-authors";
import { MediaTabs } from "@/components/media/media-tabs";
import { SectionHeading } from "@/components/ui/section-heading";
import { withBasePath } from "@/lib/base-path";
import { formatBlogDate } from "@/lib/blog/format-date";
import { groupByYear, loadAllPosts } from "@/lib/blog/posts";
import { MEDIA_DESCRIPTION, routes } from "@/lib/navigation";

import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Articles from the OpenSustain.tech community on open source, climate technology and environmental sustainability.",
};

export default async function BlogIndexPage() {
  const posts = await loadAllPosts();
  const years = groupByYear(posts);

  return (
    <main className="page-shell">
      <SectionHeading as="h1" title="Media" description={MEDIA_DESCRIPTION} />
      <MediaTabs active="articles" />

      {years.map(([year, yearPosts]) => (
        <section key={year} className={styles.year} aria-labelledby={`blog-year-${year}`}>
          <h2 id={`blog-year-${year}`} className={styles.yearTitle}>
            {year}
          </h2>
          <ul className={styles.grid}>
            {yearPosts.map((post) => (
              <li key={post.slug}>
                {/*
                 * `.card` is an <article>, not a <Link>: PostAuthors below
                 * renders its own <a> per author, and nesting that inside a
                 * whole-card <Link> is invalid HTML5 (browsers' parsing
                 * splits the outer link into duplicate tab-stops around each
                 * icon). Instead the title's <Link> gets a `::after` stretch
                 * (see .cardTitleLink) that covers the whole `.card` box, so
                 * clicking/tapping anywhere still opens the post, while the
                 * real author links stay above it (z-index) as their own
                 * single, correctly-targeted tab-stops.
                 */}
                <article className={styles.card}>
                  {post.image ? (
                    // A mat behind the image, not the image bled to the
                    // card's own edge: several posts' cover images are
                    // screenshots with a plain white background, which
                    // otherwise sit directly against the card's ground with
                    // no visible border in dark mode — reading as a broken
                    // image rather than a thumbnail. See wordcloud-image in
                    // globals.css for the same treatment on the same
                    // problem elsewhere on the site.
                    <div className={styles.cardImageWrap}>
                      {/* Static export + third-party/local blog images: plain
                          <img>, same reasoning as components/ui/avatar.tsx. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={styles.cardImage} src={withBasePath(post.image)} alt="" loading="lazy" />
                    </div>
                  ) : null}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>
                      <Link href={routes.blogPost(post.slug)} className={styles.cardTitleLink}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className={styles.cardExcerpt}>{post.excerpt}</p>
                    <div className={styles.cardMeta}>
                      <time className={styles.cardDate} dateTime={post.date}>
                        {formatBlogDate(post.date)}
                      </time>
                      <PostAuthors authors={post.authors} />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
