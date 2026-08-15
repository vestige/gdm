import { useMemo } from "react";
import { getDailyChallenge } from "../features/daily-content";

export default function MiniChallengeCard() {
  const challenge = useMemo(() => getDailyChallenge(), []);
  return (
    <section className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">今日のミニチャレンジ</h2><p className="mt-1 text-xs text-slate-500">日付ベースで毎日1つ決まります</p></div><span className="text-2xl animate-drift">🌱</span></div>
      <div className="mini-challenge-panel rounded-2xl p-4 ring-1 ring-amber-100/80">
        <p className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">{challenge.category}</p>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-800 md:text-xl">{challenge.text}</p>
      </div>
    </section>
  );
}
