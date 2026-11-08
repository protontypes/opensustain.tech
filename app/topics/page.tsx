import type { Metadata } from "next";

import { KeywordCountsChart } from "@/components/charts/keyword-counts-chart";
import { TopicsHeatmapChart } from "@/components/charts/topics-heatmap-chart";
import { WordCloud } from "@/components/charts/word-cloud";
import { PageProvenance } from "@/components/ui/page-provenance";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadKeywordCounts } from "@/lib/data";
import { loadSiteTotals } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Which topics and keywords recur across the READMEs of open-source climate and sustainability projects, and how they map onto the ecosystem's sub-categories.",
};

export default async function TopicsPage() {
  // topics-heatmap is ~820 KB; the chart fetches it from /data instead of
  // having it serialised into the RSC stream. keyword-counts is 17 KB and
  // stays server-loaded.
  const [keywordCounts, totals] = await Promise.all([loadKeywordCounts(), loadSiteTotals()]);

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Topic & Keyword Analysis"
        description="Explore the most frequent terms and thematic clusters extracted from project documentation and README files."
      />
      <PageProvenance totals={totals} show="metrics" />

      <div className="stack">
        <Panel
          id="keyword-counts"
          title="Keyword Counts"
          description="The most frequently occurring technical and conceptual keywords across the ecosystem."
        >
          <KeywordCountsChart
            records={keywordCounts.records}
            defaultTopN={keywordCounts.default_top_n}
          />
        </Panel>

        <Panel
          id="topics-heatmap"
          title="Topics Heatmap"
          description="How often each topic appears in the projects of each sub-category. Color is on a log scale, so a single dense cell does not flatten the rest."
        >
          <TopicsHeatmapChart />
        </Panel>

        <Panel
          id="word-cloud"
          title="Word Cloud"
          description="The 60 most common README keywords, sized by how many projects use each. Hover a word for its count."
          notes="Illustrative: the Keyword Counts chart above gives the exact figures."
        >
          <WordCloud records={keywordCounts.records} />
        </Panel>
      </div>
    </main>
  );
}
