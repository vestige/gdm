import LegacySectionHost from "../components/LegacySectionHost";
import PageHeader from "../components/PageHeader";

export default function MoodPage() {
  return <main className="mx-auto max-w-2xl"><PageHeader title="気分の記録" description="今日の気分入力と直近7日分の変化を確認できます。" /><LegacySectionHost targetId="moodCard" /></main>;
}
