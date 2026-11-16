import type { Contributor } from "@/lib/data/contributors";
import { formatNumber } from "@/lib/format";

import styles from "./about.module.css";

/**
 * Contributors as an atlas index: login, a dotted leader, and the number of
 * contributions, most first, set in columns.
 */
export function ContributorsGrid({ contributors }: { contributors: Contributor[] }) {
  const ordered = [...contributors].sort((a, b) => b.contributions - a.contributions);
  return (
    <ol className={styles.contributorsIndex}>
      {ordered.map((contributor) => (
        <li key={contributor.id}>
          <a
            href={contributor.html_url}
            target="_blank"
            rel="noreferrer"
            title={contributor.login}
          >
            {contributor.login}
          </a>
          <span>
            {formatNumber(contributor.contributions)}
            <span className="visually-hidden"> contributions</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
