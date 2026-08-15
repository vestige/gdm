import { useState } from "react";
import InformationCardGrid from "../components/InformationCardGrid";
import InformationModal from "../components/InformationModal";
import type { InformationCardDefinition } from "../components/information-card-types";
import LegacySectionHost from "../components/LegacySectionHost";

const informationCards: InformationCardDefinition[] = [
  { id: "weather", title: "天気", description: "現在地・設定地点の予報", icon: "☀️", summary: { selectors: ["#currentTemp", "#weatherStatus"], fallback: "天気を確認" }, action: { type: "modal", targetIds: ["weatherCard"] } },
  { id: "outfit", title: "服装・ファッション", description: "天気に合わせた提案と情報", icon: "🧥", summary: { selectors: ["#outfitSummary", "#fashionInfoLead"], fallback: "今日の服装とファッション情報" }, action: { type: "modal", targetIds: ["outfitCard", "fashionInfoCard"] } },
  { id: "english", title: "English", description: "今日のひとこと", icon: "💬", summary: { selectors: ["#dailyEnglishPhrase"], fallback: "今日の英語を確認" }, action: { type: "route", path: "/english" } },
  { id: "reading", title: "Reading", description: "朝の読み物", icon: "📚", summary: { selectors: ["#cozyReadingTitle"], fallback: "今日の記事を確認" }, action: { type: "route", path: "/reading" } },
  { id: "buddy", title: "今日の相棒", description: "朝にほっとできる一枚", icon: "🐾", summary: { selectors: ["#buddyMessage"], fallback: "今日の相棒を見る" }, action: { type: "modal", targetIds: ["dailyBuddyCard"] } },
  { id: "moon", title: "月の状態", description: "今夜の空", icon: "🌙", summary: { selectors: ["#moonPhaseName", "#moonAge"], fallback: "今日の月を確認" }, action: { type: "modal", targetIds: ["moonCard"] } },
  { id: "challenge", title: "ミニチャレンジ", description: "毎日ひとつ", icon: "🌱", summary: { selectors: ["#miniChallengeText"], fallback: "今日の小さな挑戦" }, action: { type: "modal", targetIds: ["miniChallengeCard"] } },
  { id: "quote", title: "今日の名言", icon: "✨", summary: { selectors: ["#quoteText"], fallback: "今日の言葉を読む" }, action: { type: "modal", targetIds: ["quoteCard"] } },
  { id: "on-this-day", title: "今日は何の日", icon: "📅", summary: { selectors: ["#onThisDayText"], fallback: "今日のできごと" }, action: { type: "modal", targetIds: ["onThisDayCard"] } }
];

const settingsCard: InformationCardDefinition = {
  id: "settings",
  title: "名前・場所の設定",
  icon: "⚙️",
  summary: { selectors: ["#locationStatus"], fallback: "表示地点を変更" },
  action: { type: "modal", targetIds: ["profileSetupCard"] }
};

export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  return (
    <main>
      <header className="relative mb-8 pr-14">
        <div className="max-w-3xl">
          <p className="text-sm text-slate-500">{today} ・ 良い一日を</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl"><span className="shine-text">おはようございます</span> <span aria-hidden="true">☀️</span></h1>
          <p className="mt-3 text-slate-600">毎朝触るものを、ひとつの場所にまとめました。</p>
        </div>
        <button
          type="button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          className="absolute right-0 top-0 inline-flex size-12 items-center justify-center rounded-2xl bg-white/85 text-slate-700 shadow-sm ring-1 ring-white/80 transition hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
          aria-controls="dashboard-menu"
        >
          <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
            <span className="h-0.5 w-full rounded-full bg-current" />
            <span className="h-0.5 w-full rounded-full bg-current" />
            <span className="h-0.5 w-full rounded-full bg-current" />
          </span>
        </button>
        {isMenuOpen && (
          <div id="dashboard-menu" className="absolute right-0 top-14 z-30 w-64 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200/80">
            <p className="px-3 pb-2 pt-1 text-xs font-bold tracking-wider text-slate-400">メニュー</p>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsSettingsOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <span className="text-lg" aria-hidden="true">⚙️</span>
              <span><span className="block">名前・場所の設定</span><span className="mt-0.5 block text-xs font-normal text-slate-500">プロフィールと天気の地点を変更</span></span>
            </button>
          </div>
        )}
      </header>
      <section aria-labelledby="morning-dashboard-title">
        <p className="text-xs font-bold tracking-widest text-indigo-500">FOR YOU</p>
        <h2 id="morning-dashboard-title" className="mb-5 mt-1 text-2xl font-extrabold text-slate-900">今朝のダッシュボード</h2>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <LegacySectionHost targetId="fortuneCard" />
          <LegacySectionHost targetId="moodCard" />
          <LegacySectionHost targetId="leavingNoteCard" />
          <LegacySectionHost targetId="luckyBoxCard" />
        </div>
      </section>
      <section className="mt-12" aria-labelledby="information-title">
        <p className="text-xs font-bold tracking-widest text-slate-500">WHEN YOU NEED IT</p>
        <h2 id="information-title" className="mt-1 text-2xl font-extrabold text-slate-900">今日の情報</h2>
        <p className="mb-5 mt-2 text-sm text-slate-600">必要なカードを選ぶと、詳細を確認できます。</p>
        <InformationCardGrid definitions={informationCards} />
      </section>
      <InformationModal definition={isSettingsOpen ? settingsCard : null} onClose={() => setIsSettingsOpen(false)} />
    </main>
  );
}
