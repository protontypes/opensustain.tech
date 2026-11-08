import type { Metadata } from "next";

import { LinkList } from "@/components/ui/link-list";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadEducation } from "@/lib/data/site";
import { formatNumber } from "@/lib/format";

// education.md is edited by pull request, like the README.
const EDUCATION_SOURCE =
  "https://github.com/protontypes/open-sustainable-technology/blob/main/education.md";

export async function generateMetadata(): Promise<Metadata> {
  const education = await loadEducation();
  return {
    title: "Learning resources",
    description: `${formatNumber(education.totals.resources)} open courses, books and tutorials for getting started in climate, energy and environmental technology.`,
  };
}

/*
 * The old mkdocs "Education" tab, back as a page of its own. These are
 * courses, books and tutorials, not projects, so they are counted here and
 * nowhere else: not in the directory, the ring or any analytics total.
 */
export default async function EducationPage() {
  const education = await loadEducation();

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Learning resources"
        description={`${formatNumber(education.totals.resources)} open courses, books and tutorials across ${education.totals.topics} topics, for getting started in climate, energy and environmental technology.`}
      />

      <div className="stack">
        {education.topics.map((topic) => (
          <Panel key={topic.name} title={topic.name}>
            {topic.subtopics.map((subtopic) => (
              <section key={subtopic.name ?? topic.name}>
                {subtopic.name ? <h3>{subtopic.name}</h3> : null}
                <LinkList
                  items={subtopic.resources.map((resource) => ({
                    href: resource.url,
                    title: resource.name,
                    description: resource.description,
                    external: true,
                  }))}
                />
              </section>
            ))}
          </Panel>
        ))}

        <p>
          Know a resource that belongs here?{" "}
          <a href={EDUCATION_SOURCE} target="_blank" rel="noreferrer">
            Add it to education.md
          </a>
          .
        </p>
      </div>
    </main>
  );
}
