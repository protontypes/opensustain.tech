import type { TeamMember } from "@/lib/data/team";

import styles from "./about.module.css";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * One team member's card. Every field that lib/data/team.ts left `null` or
 * `[]` renders a visible "TODO: ..." marker here — nothing is guessed to
 * make the card look complete.
 */
export function TeamCard({ member }: { member: TeamMember }) {
  const displayName = member.fullName ?? member.givenName;

  return (
    <li className={styles.teamCard}>
      {member.avatarUrl ? (
        // Static export has no image optimizer to route this through.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.avatar}
          src={member.avatarUrl}
          alt=""
          width={72}
          height={72}
        />
      ) : (
        <div className={styles.avatarPlaceholder} aria-hidden="true">
          {initials(displayName)}
        </div>
      )}

      <p className={styles.name}>{displayName}</p>
      {member.fullName === null ? (
        <span className={styles.todo}>TODO: full name</span>
      ) : null}

      {member.role ? (
        <p className={styles.role}>{member.role}</p>
      ) : (
        <span className={styles.todo}>TODO: role</span>
      )}

      {member.bio ? (
        <p className={styles.bio}>{member.bio}</p>
      ) : (
        <span className={styles.todo}>TODO: bio</span>
      )}

      {member.links.length > 0 ? (
        <div className={styles.links}>
          {member.links.map((link) => (
            <a
              key={link.url}
              className={styles.linkPill}
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : (
        <span className={styles.todo}>TODO: links (GitHub / LinkedIn / site)</span>
      )}
    </li>
  );
}
