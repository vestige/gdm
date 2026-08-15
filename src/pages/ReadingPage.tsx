import LegacySectionHost from "../components/LegacySectionHost";
import PageHeader from "../components/PageHeader";

export default function ReadingPage() {
  return <main><PageHeader title="今日のReading" description="朝のほっこり記事と技術記事をまとめて読めます。" /><div className="grid items-start gap-5 md:grid-cols-2"><LegacySectionHost targetId="cozyReadingCard" /><LegacySectionHost targetId="techReadingCard" /></div></main>;
}
