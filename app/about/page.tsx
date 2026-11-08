import type { Metadata } from "next";
import Link from "next/link";

import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
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

export default async function AboutPage() {
  const { contributors, source } = await loadContributors();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="About Open Sustainable Technology"
        description="A directory and analysis of the open source ecosystem for climate change, sustainable energy, biodiversity, and natural resources."
      />

      <div className="stack">
        <Panel title="What this is">
          <div className="prose">
            <p>
              Open Sustainable Technology finds, lists, and shares open
              source projects that preserve or analyze the natural systems we
              depend on; a stable climate, clean water, fertile soil, and
              healthy ecosystems. What began as a community-maintained list
              has grown into the directory and analytics on this site:
              thousands of projects across renewable energy, emissions,
              biodiversity and more, each linked to metrics on its activity
              and reach.
            </p>
          </div>
        </Panel>

        <Panel title="Who runs it">
          <div className="prose">
            <p>
              Open Sustainable Technology is an open community, founded by
              Tobias Augspurger under{" "}
              <a
                href="https://github.com/protontypes"
                target="_blank"
                rel="noreferrer"
              >
                protontypes
              </a>
              . The list lives in a{" "}
              <a href={ostGithubUrl} target="_blank" rel="noreferrer">
                public GitHub repository
              </a>
              , and every addition or correction arrives as a pull request
              that a maintainer reviews before it is merged.
            </p>
            <p>
              There is no membership to apply for: anyone who contributes can
              become a maintainer. How a project qualifies is set out in the{" "}
              <a href={contributeLink.href} target="_blank" rel="noreferrer">
                contributing guide
              </a>
              .
            </p>
            <h3>What a listing means</h3>
            <p>
              A listing means a project met the contributing guide&rsquo;s
              criteria when it was reviewed. It is not a certification or an
              endorsement. The rankings on the analytics pages are computed
              from public activity data, not judged by the maintainers; the{" "}
              <Link href={routes.methodology}>methodology</Link> explains how.
            </p>
          </div>
        </Panel>

        <Panel id="contact" title="Contact">
          <div className="prose">
            <p>
              The quickest way to reach the maintainers, for corrections,
              press or partnerships, is the{" "}
              <a href={communityDiscordUrl} target="_blank" rel="noreferrer">
                community Discord
              </a>
              . To fix an entry yourself, open a pull request or an issue on{" "}
              <a href={ostGithubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
              .
            </p>
          </div>
        </Panel>

        <Panel
          title="Team"
          description="The people building and maintaining Open Sustainable Technology."
        >
          <ul className={styles.teamGrid}>
            {team.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </ul>
        </Panel>

        <Panel
          title="Contributors"
          description={`Everyone who has sent a pull request to ${ostRepoSlug}.`}
        >
          {source === "fallback" ? (
            <p className={styles.sectionNote}>
              This list is from an earlier snapshot and may be missing the
              most recent contributors.
            </p>
          ) : null}
          <ContributorsGrid contributors={contributors} />
        </Panel>
      </div>
    </main>
  );
}
