import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostAuthors } from "@/components/blog/post-authors";
import { formatBlogDate } from "@/lib/blog/format-date";
import { blogSlugs, loadPost } from "@/lib/blog/posts";
import { routes } from "@/lib/navigation";

import styles from "./post.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// `output: "export"` pre-renders every route at build time, so every slug
// this route can serve has to be enumerated up front.
export async function generateStaticParams() {
  return blogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};

  const images = post.image ? [post.image] : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: post.authors.map((author) => author.name),
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  return (
    <main className="page-shell">
      <article className={styles.article}>
        <Link href={routes.blog} className={`inline-link ${styles.back}`}>
          ← All articles
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <PostAuthors authors={post.authors} />
            <time className={styles.date} dateTime={post.date}>
              {formatBlogDate(post.date)}
            </time>
          </div>
        </header>

        {post.image ? (
          // Same mat treatment as the /blog index cards (see blog.module.css'
          // .cardImageWrap): a step of background behind the image so a
          // white-background screenshot doesn't bleed straight into the page.
          <div className={styles.coverImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.coverImage} src={post.image} alt="" />
          </div>
        ) : null}

        <div
          className={`prose ${styles.body}`}
          // Body HTML is rendered at build time from this repo's own
          // content/blog/*.md (lib/blog/posts.ts), not user input.
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </main>
  );
}
