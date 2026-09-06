import type { Metadata } from "next";
import Link from "next/link";

import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { METRIC_HELP } from "@/lib/charts/metric-help";
import { loadFilters } from "@/lib/data";
import { loadMethodologyFacts } from "@/lib/data/methodology";
import { formatNumber, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Where the data comes from, how each metric is defined, and what this dashboard cannot tell you.",
};

const PROJECTS_CSV =
  "https://api.getgrist.com/o/docs/api/docs/gSscJkc5Rb1Rw45gh1o1Yc/download/csv?viewSection=5&tableId=Projects";
const ORGANIZATIONS_CSV =
  "https://api.getgrist.com/o/docs/api/docs/gSscJkc5Rb1Rw45gh1o1Yc/download/csv?viewSection=7&tableId=Organizations";

export default async function MethodologyPage() {
  const [facts, filters] = await Promise.all([
    loadMethodologyFacts(),
    loadFilters(),
  ]);

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="What this dashboard is, and what it cannot tell you"
        description="Every chart here reads one nightly snapshot of a public dataset. These are its sources, its definitions, and the places it is known to be wrong or incomplete — stated here rather than left for a reader to discover."
      />

      <div className="stack">
        <Panel title="Where the data comes from">
          <div className="prose">
            <p>
              Projects and organizations come from{" "}
              <a href="https://opensustain.tech/" target="_blank" rel="noreferrer">
                OpenSustain.tech
              </a>
              , a curated index of open-source work in environmental
              sustainability. Repository and package metrics — contributors,
              commits, downloads, dependents, the score — come from{" "}
              <a href="https://ecosyste.ms/" target="_blank" rel="noreferrer">
                Ecosyste.ms
              </a>
              . Categories and sub-categories are assigned by the OpenSustain
              taxonomy, not inferred.
            </p>
            <p>
              The dataset is rebuilt on its own schedule and this site reads
              whatever the last build produced. This one is from{" "}
              <strong>
                <time dateTime={facts.snapshot.iso}>{facts.snapshot.label}</time>
              </strong>
              , and covers {formatNumber(facts.projects)} projects,{" "}
              {formatNumber(facts.organizations)} organizations,{" "}
              {filters.categories.length} categories and{" "}
              {filters.sub_categories.length} sub-categories.
            </p>
            <p>
              The data is published under{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
              . You can take the whole thing:{" "}
              <a href={PROJECTS_CSV} target="_blank" rel="noreferrer">
                projects CSV
              </a>{" "}
              ·{" "}
              <a href={ORGANIZATIONS_CSV} target="_blank" rel="noreferrer">
                organizations CSV
              </a>
              . Every chart on this site also exports the rows it is showing.
            </p>
          </div>
        </Panel>

        <Panel
          title="What each metric means"
          description="Nine metrics rank projects across this site. Three of them are composites or ratios that do not read the way they look."
        >
          <dl className="definition-list">
            {Object.entries(METRIC_HELP).map(([id, help]) => (
              <div key={id} className="definition-list__item">
                <dt>
                  {facts.metricLabels[id as keyof typeof facts.metricLabels] ??
                    id}
                </dt>
                <dd>
                  {help.text}
                  {help.href ? (
                    <>
                      {" "}
                      <a href={help.href} target="_blank" rel="noreferrer">
                        {help.hrefLabel ?? "More"}
                      </a>
                      .
                    </>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel
          title="How much of the data is actually there"
          description="A metric reported by few projects is not a metric where most projects scored zero. Charts on this site leave unreported projects out rather than drawing them at zero, and say so when they do."
          notes="Share of the tracked projects reporting a non-zero value for each metric."
        >
          <ul className="coverage-list">
            {facts.coverage.map((entry) => (
              <li key={entry.id}>
                <span className="coverage-list__name">{entry.label}</span>
                <span
                  className="coverage-list__bar"
                  aria-hidden="true"
                  style={{ ["--share" as string]: `${entry.share * 100}%` }}
                />
                <span className="coverage-list__value">
                  {formatPercent(entry.share)}
                  <small>
                    {formatNumber(entry.covered)} of{" "}
                    {formatNumber(entry.total)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Known limitations"
          description="Things that are wrong or missing in the source data, and what this site does about each."
        >
          <div className="prose">
            <h3>Projects have no country</h3>
            <p>
              Nothing in the dataset places a project geographically. Every map
              and country chart here is showing the location its{" "}
              <em>organization</em> records, and {formatNumber(102)}{" "}
              organizations record none at all. A country&rsquo;s bar is
              therefore about where maintainers say they are, not where the
              software is used.
            </p>

            <h3>Package ecosystems are over-counted</h3>
            <p>
              The source lists a package registry once per package rather than
              once per project, so a project publishing several packages to PyPI
              is counted several times — the ecosystem chart&rsquo;s axis reads
              &ldquo;entries&rdquo; for that reason. Every non-empty value in the
              source also ends with a trailing comma, which the pipeline&rsquo;s
              split turns into one empty bucket per project; this site drops that
              bucket rather than drawing it as the third-largest ecosystem.
            </p>

            <h3>Project names are not unique</h3>
            <p>
              {facts.duplicateNames} names are shared by more than one project.
              The repository URL is the only unique key, which is what this site
              uses to identify a project.
            </p>

            <h3>Citations and downloads are sparse</h3>
            <p>
              Both depend on a project having been registered somewhere that
              records them — a DOI or Zenodo deposit for citations, a package
              registry for downloads. A zero means &ldquo;not recorded&rdquo;
              far more often than it means &ldquo;no impact&rdquo;, so neither
              should be read as a ranking of importance.
            </p>

            <h3>Two countries are drawn approximately</h3>
            <p>
              The map uses Natural Earth&rsquo;s 110m boundaries, which omit
              Singapore at that scale; it is drawn from its own bounding box so
              its organizations are not silently lost. Antarctica is left off,
              having no organizations and a sixth of the map&rsquo;s height.
              Organizations recording &ldquo;Global&rdquo; or &ldquo;European
              Union&rdquo; instead of a country have no territory to shade and
              are counted underneath the map instead.
            </p>
          </div>
        </Panel>

        <Panel title="Corrections">
          <div className="prose">
            <p>
              If something here is wrong, the data and the dashboard are
              separate places to fix it. Data corrections belong upstream in{" "}
              <a
                href="https://github.com/protontypes/open-sustainable-technology"
                target="_blank"
                rel="noreferrer"
              >
                the OpenSustain.tech index
              </a>
              ; anything about how a chart reads belongs in{" "}
              <a
                href="https://github.com/protontypes/opensustain.analytics"
                target="_blank"
                rel="noreferrer"
              >
                this dashboard
              </a>
              .
            </p>
            <p>
              <Link className="inline-link" href="/">
                Back to the overview
              </Link>
            </p>
          </div>
        </Panel>
      </div>
    </main>
  );
}
