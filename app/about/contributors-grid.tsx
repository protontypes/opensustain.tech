import type { Contributor } from "@/lib/data/contributors";

import styles from "./about.module.css";

export function ContributorsGrid({ contributors }: { contributors: Contributor[] }) {
  return (
    <ul className={styles.contributorsGrid}>
      {contributors.map((contributor) => (
        <li key={contributor.id} className={styles.contributorCard}>
          <a
            href={contributor.html_url}
            target="_blank"
            rel="noreferrer"
            title={`${contributor.login} — ${contributor.contributions} contributions`}
          >
            {/* Static export has no image optimizer to route this through. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.contributorAvatar}
              src={contributor.avatar_url}
              alt=""
              width={48}
              height={48}
              loading="lazy"
            />
          </a>
          <a
            className={styles.contributorLogin}
            href={contributor.html_url}
            target="_blank"
            rel="noreferrer"
          >
            {contributor.login}
          </a>
        </li>
      ))}
    </ul>
  );
}
