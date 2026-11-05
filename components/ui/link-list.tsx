import Link from "next/link";

export type LinkListItem = {
  href: string;
  title: string;
  description: string;
  /** Opens in a new tab, for a destination off this site. */
  external?: boolean;
};

/**
 * Where to go next, as plain links with a line each — the quiet alternative to
 * a grid of cards, for lists that should read as secondary to the page.
 */
export function LinkList({ items }: { items: LinkListItem[] }) {
  return (
    <ul className="link-list">
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
          <p>{item.description}</p>
        </li>
      ))}
    </ul>
  );
}
