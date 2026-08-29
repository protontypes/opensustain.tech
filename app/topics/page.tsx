import { KeywordCountsChart } from "@/components/charts/keyword-counts-chart";
import { TopicsHeatmapChart } from "@/components/charts/topics-heatmap-chart";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { loadKeywordCounts, loadTopicsHeatmap, loadWordcloud } from "@/lib/data";

export default async function TopicsPage() {
  const [keywordCounts, topicsHeatmap, wordcloud] = await Promise.all([
    loadKeywordCounts(),
    loadTopicsHeatmap(),
    loadWordcloud(),
  ]);

  return (
    <main className="page-shell">
      <SectionHeading
        eyebrow="Topics"
        title="Topic & Keyword Analysis"
        description="Explore the most frequent terms and thematic clusters extracted from project documentation and README files."
      />

      <div className="stack">
        <Panel
          title="Keyword Counts"
          description="The most frequently occurring technical and conceptual keywords across the ecosystem."
        >
          <KeywordCountsChart records={keywordCounts.records} />
        </Panel>

        <Panel
          title="Topics Heatmap"
          description="A correlation matrix revealing the density of specific topics across different sub-categories."
        >
          <TopicsHeatmapChart payload={topicsHeatmap} />
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
