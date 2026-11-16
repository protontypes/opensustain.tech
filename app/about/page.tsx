import type { Metadata } from "next";
import Link from "next/link";

import { loadContributors } from "@/lib/data/contributors";
import { team } from "@/lib/data/team";
import { communityDiscordUrl, contributeLink, ostGithubUrl, routes } from "@/lib/navigation";

import styles from "./about.module.css";
import { ContributorsGrid } from "./contributors-grid";
import { TeamCard } from "./team-card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Open technology projects sustaining stable climate, energy supply, biodiversity and vital natural resources; who's behind Open Sustainable Technology.",
};

const ostRepoSlug = ostGithubUrl.replace("https://github.com/", "");

const contents = [
  { id: "what", label: "What this is" },
  { id: "who", label: "Who runs it" },
  { id: "listing", label: "What a listing means" },
  { id: "contact", label: "Contact" },
  { id: "team", label: "Team" },
  { id: "contributors", label: "Contributors" },
];

export default async function AboutPage() {
  const { contributors, source } = await loadContributors();

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div className="container">
          <p className="kicker">About</p>
          <h1 className={styles.title}>About Open Sustainable Technology</h1>
          <p className={styles.lede}>
            A directory and analysis of the open source ecosystem for climate change,
            sustainable energy, biodiversity, and natural resources.
          </p>
        </div>
      </header>

      <div className={`container ${styles.layout}`}>
        <nav className={styles.toc} aria-labelledby="about-contents">
          <p id="about-contents" className="kicker">
            On this page
          </p>
          <ol>
            {contents.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.body}>
          <section id="what" className={styles.prose} aria-labelledby="what-title">
            <h2 id="what-title">What this is</h2>
            <p>
              Open Sustainable Technology finds, lists, and shares open source projects that
              preserve or analyze the natural systems we depend on; a stable climate, clean
              water, fertile soil, and healthy ecosystems. What began as a community-maintained
              list has grown into the directory and analytics on this site: thousands of
              projects across renewable energy, emissions, biodiversity and more, each linked
              to metrics on its activity and reach.
            </p>
          </section>

          <section id="who" className={styles.prose} aria-labelledby="who-title">
            <h2 id="who-title">Who runs it</h2>
            <p>
              Open Sustainable Technology is an open community, founded by Tobias Augspurger
              under{" "}
              <a href="https://github.com/protontypes" target="_blank" rel="noreferrer">
                protontypes
              </a>
              . The list lives in a{" "}
              <a href={ostGithubUrl} target="_blank" rel="noreferrer">
                public GitHub repository
              </a>
              , and every addition or correction arrives as a pull request that a maintainer
              reviews before it is merged.
            </p>
            <p>
              There is no membership to apply for: anyone who contributes can become a
              maintainer. How a project qualifies is set out in the{" "}
              <a href={contributeLink.href} target="_blank" rel="noreferrer">
                contributing guide
              </a>
              .
            </p>
            <h3 id="listing">What a listing means</h3>
            <p>
              A listing means a project met the contributing guide&rsquo;s criteria when it was
              reviewed. It is not a certification or an endorsement. The rankings on the
              analytics pages are computed from public activity data, not judged by the
              maintainers; the <Link href={routes.methodology}>methodology</Link> explains how.
            </p>
          </section>

          <section
            id="contact"
            className={`${styles.prose} ${styles.contact}`}
            aria-labelledby="contact-title"
          >
            <h2 id="contact-title">Contact</h2>
            <p>
              The quickest way to reach the maintainers, for corrections, press or
              partnerships, is the community Discord. To fix an entry yourself, open a pull
              request or an issue on GitHub.
            </p>
            <div className={styles.actions}>
              <a
                className="pill pill--primary"
                href={communityDiscordUrl}
                target="_blank"
                rel="noreferrer"
              >
                Join the Discord
              </a>
              <a className="pill" href={`${ostGithubUrl}/issues`} target="_blank" rel="noreferrer">
                Open an issue on GitHub
              </a>
            </div>
          </section>

          <section id="team" aria-labelledby="team-title">
            <div className={styles.subhead}>
              <h2 id="team-title">Team</h2>
              <p>The people building and maintaining Open Sustainable Technology.</p>
            </div>
            <ul className={styles.teamGrid}>
              {team.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </ul>
          </section>

          <section id="contributors" aria-labelledby="contributors-title">
            <div className={styles.subhead}>
              <h2 id="contributors-title">Contributors</h2>
              <p>
                Everyone who has sent a pull request to {ostRepoSlug}, with their number of
                contributions.
              </p>
            </div>
            {source === "fallback" ? (
              <p className={styles.sectionNote}>
                This list is from an earlier snapshot and may be missing the most recent
                contributors.
              </p>
            ) : null}
            <ContributorsGrid contributors={contributors} />
          </section>
        </div>
      </div>
    </main>
  );
}
