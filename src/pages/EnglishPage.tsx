import LegacySectionHost from "../components/LegacySectionHost";
import PageHeader from "../components/PageHeader";

export default function EnglishPage() {
  return <main className="mx-auto max-w-2xl"><PageHeader title="今日のEnglish" description="今日のひとことと、自然な返し方を確認できます。" /><LegacySectionHost targetId="dailyEnglishCard" /></main>;
}
