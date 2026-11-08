import type { Metadata } from "next";

import { LinkList } from "@/components/ui/link-list";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadEducation } from "@/lib/data/site";
import { formatNumber } from "@/lib/format";

// education.md is edited by pull request, like the README.
const EDUCATION_SOURCE =
  "https://github.com/protontypes/open-sustainable-technology/blob/main/education.md";

/**
 * What kind of resource a link is, read from its address. Conservative: a host
 * that says nothing certain is a "Website" rather than a guess.
 */
function resourceKind(url: string): string {
  let host = "";
  let pathname = "";
  try {
    ({ hostname: host, pathname } = new URL(url));
  } catch {
    return "Website";
  }
  host = host.replace(/^www\./, "");
  if (pathname.toLowerCase().endsWith(".pdf")) return "PDF";
  if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(host)) return "Video";
  if (/(^|\.)(github\.com|gitlab\.com|codeberg\.org)$/.test(host)) return "Repository";
  if (/(coursera\.org|edx\.org|udemy\.com|futurelearn\.com)$/.test(host)) return "Course";
  if (/readthedocs\.io$/.test(host)) return "Documentation";
  return "Website";
}

/** "Earth Systems" → "earth-systems", for the topic index's anchors. */
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

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

      {/* 127 items across 11 topics stack to several screens; this is the
          way to jump straight to one. */}
      <nav className="page-index" aria-label="Topics">
        <ul>
          {education.topics.map((topic) => (
            <li key={topic.name}>
              <a href={`#${slug(topic.name)}`}>
                {topic.name}
                <span>
                  {topic.subtopics.reduce((sum, sub) => sum + sub.resources.length, 0)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="stack">
        {education.topics.map((topic) => (
          <Panel key={topic.name} id={slug(topic.name)} title={topic.name}>
            {topic.subtopics.map((subtopic) => (
              <section key={subtopic.name ?? topic.name} className="education-subtopic">
                {subtopic.name ? (
                  <h3 className="education-subtopic__title">{subtopic.name}</h3>
                ) : null}
                <LinkList
                  compact
                  items={subtopic.resources.map((resource) => ({
                    href: resource.url,
                    title: resource.name,
                    description: resource.description,
                    external: true,
                    tag: resourceKind(resource.url),
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
