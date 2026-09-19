import type { Metadata } from "next";

import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadContributors } from "@/lib/data/contributors";
import { team } from "@/lib/data/team";
import { ostGithubUrl } from "@/lib/navigation";

import styles from "./about.module.css";
import { ContributorsGrid } from "./contributors-grid";
import { TeamCard } from "./team-card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Open technology projects sustaining stable climate, energy supply, biodiversity and vital natural resources; who's behind OpenSustain.tech.",
};

const ostRepoSlug = ostGithubUrl.replace("https://github.com/", "");

export default async function AboutPage() {
  const { contributors, source } = await loadContributors();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="About OpenSustain.tech"
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
            <p>
              It is maintained by{" "}
              <a
                href="https://github.com/protontypes"
                target="_blank"
                rel="noreferrer"
              >
                protontypes
              </a>{" "}
              and a global community of contributors who research, verify,
              and add projects; anyone can{" "}
              <a
                href={`${ostGithubUrl}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noreferrer"
              >
                open a pull request
              </a>{" "}
              to add one.
            </p>
          </div>
        </Panel>

        <Panel
          title="Team"
          description="The people building and maintaining OpenSustain.tech."
        >
          <ul className={styles.teamGrid}>
            {team.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </ul>
        </Panel>

        <Panel
          title="Contributors"
          description={`Everyone who has sent a pull request to ${ostRepoSlug}, pulled from GitHub at build time.`}
        >
          {source === "fallback" ? (
            <p className={styles.sectionNote}>
              Showing a committed snapshot from an earlier build; the live
              GitHub contributors list could not be fetched this time (no
              network, or the unauthenticated rate limit). Set a{" "}
              <code>GITHUB_TOKEN</code> environment variable to fetch the
              live list on the next build.
            </p>
          ) : null}
          <ContributorsGrid contributors={contributors} />
        </Panel>
      </div>
    </main>
  );
}
