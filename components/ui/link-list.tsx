import Link from "next/link";

export type LinkListItem = {
  href: string;
  title: string;
  description: string;
  /** Opens in a new tab, for a destination off this site. */
  external?: boolean;
  /** A short kind label beside the title ("Repository", "Video"). */
  tag?: string;
};

/**
 * Where to go next, as plain links with a line each — the quiet alternative to
 * a grid of cards, for lists that should read as secondary to the page.
 */
export function LinkList({
  items,
  compact = false,
}: {
  items: LinkListItem[];
  /** Smaller titles, for long reference lists rather than a page's next steps. */
  compact?: boolean;
}) {
  return (
    <ul className={compact ? "link-list link-list--compact" : "link-list"}>
      {items.map((item) => (
        <li key={item.href}>
          {item.external ? (
            <a
              className="link-list__link"
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              {item.title}
            </a>
          ) : (
            <Link className="link-list__link" href={item.href}>
              {item.title}
            </Link>
          )}
          {item.tag ? <span className="link-list__tag">{item.tag}</span> : null}
          <p>{item.description}</p>
        </li>
      ))}
    </ul>
  );
}
