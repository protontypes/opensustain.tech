import type { Metadata } from "next";
import Link from "next/link";

import { PostAuthors } from "@/components/blog/post-authors";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatBlogDate } from "@/lib/blog/format-date";
import { groupByYear, loadAllPosts } from "@/lib/blog/posts";
import { routes } from "@/lib/navigation";

import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing from the OpenSustain.tech community on open source, climate technology and environmental sustainability.",
};

export default async function BlogIndexPage() {
  const posts = await loadAllPosts();
  const years = groupByYear(posts);

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Blog"
        description="Writing from the OpenSustain.tech community on open source, climate technology and environmental sustainability."
      />

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
                    // Static export + third-party/local blog images: plain
                    // <img>, same reasoning as components/ui/avatar.tsx.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.cardImage} src={post.image} alt="" loading="lazy" />
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
