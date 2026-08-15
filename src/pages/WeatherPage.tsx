import LegacySectionHost from "../components/LegacySectionHost";
import PageHeader from "../components/PageHeader";

export default function WeatherPage() {
  return <main><PageHeader title="天気と服装" description="今日の予報と、天気に合わせた服装・ファッション情報です。" /><div className="grid items-start gap-5 lg:grid-cols-2"><LegacySectionHost targetId="weatherCard" /><LegacySectionHost targetId="outfitCard" /><LegacySectionHost targetId="fashionInfoCard" className="lg:col-span-2" /></div></main>;
}
