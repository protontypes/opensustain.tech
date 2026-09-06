import type { Metadata } from "next";

import { KeywordCountsChart } from "@/components/charts/keyword-counts-chart";
import { TopicsHeatmapChart } from "@/components/charts/topics-heatmap-chart";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadKeywordCounts, loadWordcloud } from "@/lib/data";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Which topics and keywords recur across the READMEs of open-source climate and sustainability projects, and how they map onto the ecosystem's sub-categories.",
};

export default async function TopicsPage() {
  // topics-heatmap is ~820 KB; the chart fetches it from /data instead of
  // having it serialised into the RSC stream. keyword-counts is 17 KB and
  // stays server-loaded.
  const [keywordCounts, wordcloud] = await Promise.all([
    loadKeywordCounts(),
    loadWordcloud(),
  ]);

  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Topic & Keyword Analysis"
        description="Explore the most frequent terms and thematic clusters extracted from project documentation and README files."
      />

      <div className="stack">
        <Panel
          title="Keyword Counts"
          description="The most frequently occurring technical and conceptual keywords across the ecosystem."
        >
          <KeywordCountsChart
            records={keywordCounts.records}
            defaultTopN={keywordCounts.default_top_n}
          />
        </Panel>

        <Panel
          title="Topics Heatmap"
          description="How often each topic appears in the projects of each sub-category. Color is on a log scale, so a single dense cell does not flatten the rest."
        >
          <TopicsHeatmapChart />
        </Panel>

        <Panel
          title="Word Cloud"
          description="A visual representation of the overall vocabulary and focus areas within the ecosystem."
        >
          <img
            className="wordcloud-image"
            src={wordcloud.image_url}
            alt={wordcloud.caption}
          />
          <p className="panel-footnote">{wordcloud.caption}</p>
        </Panel>
      </div>
    </main>
  );
}
