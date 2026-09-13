import Link from "next/link";

import { blogSlugs } from "@/lib/blog/posts";
import { routes } from "@/lib/navigation";
import { presentations } from "@/lib/presentations";

import styles from "./media-tabs.module.css";

const tabs = [
  { id: "articles", href: routes.blog, label: "Articles", count: () => blogSlugs().length },
  { id: "talks", href: routes.talks, label: "Talks", count: () => presentations.length },
] as const;

export type MediaTab = (typeof tabs)[number]["id"];

/**
 * The tab bar shared by /blog and /blog/talks. Each tab is its own route
 * rather than client-side state: it needs no JavaScript on a static export,
 * and every tab has a URL of its own to share or bookmark.
 */
export function MediaTabs({ active }: { active: MediaTab }) {
  return (
    <nav className={styles.tabs} aria-label="Media">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={styles.tab}
          aria-current={tab.id === active ? "page" : undefined}
        >
          {tab.label}
          <span className={styles.count}>{tab.count()}</span>
        </Link>
      ))}
    </nav>
  );
}
