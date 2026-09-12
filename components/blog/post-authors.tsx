import type { BlogAuthor, BlogAuthorIcon } from "@/lib/blog/posts";

// Font Awesome (brands) is already loaded site-wide in app/layout.tsx, so
// these reuse it rather than shipping another icon set for six glyphs.
const ICON_CLASS: Record<BlogAuthorIcon, string> = {
  linkedin: "fa-brands fa-linkedin",
  twitter: "fa-brands fa-twitter",
  mastodon: "fa-brands fa-mastodon",
  github: "fa-brands fa-github",
};

/**
 * A post's byline: "Name [icon] · Name [icon] · Name". Ported from the
 * mkdocs posts' `__Name__ [:fontawesome-brands-x:](url)` byline syntax —
 * some authors there carry no link/icon at all (e.g. a co-author credited by
 * name only), which `author.url` being optional preserves.
 */
export function PostAuthors({
  authors,
  className,
}: {
  authors: BlogAuthor[];
  className?: string;
}) {
  if (authors.length === 0) return null;

  return (
    <p className={["blog-authors", className].filter(Boolean).join(" ")}>
      {authors.map((author, index) => (
        <span className="blog-authors__item" key={`${author.name}-${index}`}>
          <span className="blog-authors__name">{author.name}</span>
          {author.url && author.icon ? (
            <a
              className="blog-authors__icon"
              href={author.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${author.name} on ${author.icon}`}
            >
              <i className={ICON_CLASS[author.icon]} aria-hidden="true" />
            </a>
          ) : null}
          {index < authors.length - 1 ? (
            <span className="blog-authors__sep" aria-hidden="true">
              ·
            </span>
          ) : null}
        </span>
      ))}
    </p>
  );
}
