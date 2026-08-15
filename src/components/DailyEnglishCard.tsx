import { useState } from "react";
import { getDailyEnglishSelection } from "../features/daily-english";

export default function DailyEnglishCard() {
  const [{ card, status }] = useState(getDailyEnglishSelection);
  return (
    <section className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">今日のひとこと英語</h2><p className="mt-1 text-xs text-slate-500">{status}</p></div><span className="text-2xl animate-drift">💬</span></div>
      <div className="english-learning-panel mt-4 rounded-2xl p-4 ring-1 ring-slate-200/80">
        <div className="flex flex-wrap gap-2"><span className="english-learning-badge rounded-full px-3 py-1 text-xs font-semibold text-slate-700">{card.category}</span><span className="english-learning-badge rounded-full px-3 py-1 text-xs font-semibold text-slate-700">{card.level === "easy" ? "やさしめ" : "ふつう"}</span></div>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-800">{card.phrase}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{card.phraseJa}</p><p className="mt-3 text-sm font-medium text-slate-700">使う場面: {card.scene}</p>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/80"><p className="text-sm text-slate-500">ひとこと返答</p><p className="mt-2 text-base font-semibold leading-relaxed text-slate-800">{card.reply}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{card.replyJa}</p></div>
    </section>
  );
}
