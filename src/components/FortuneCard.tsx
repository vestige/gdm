import { useEffect, useMemo, useState } from "react";
import { getDailyFortune } from "../features/daily-content";

const PROFILE_KEY = "gdm:profileName";

export default function FortuneCard() {
  const [name, setName] = useState(() => localStorage.getItem(PROFILE_KEY)?.trim() || "匿名さん");
  useEffect(() => {
    const update = () => setName(localStorage.getItem(PROFILE_KEY)?.trim() || "匿名さん");
    window.addEventListener("gdm:profile-name-change", update);
    return () => window.removeEventListener("gdm:profile-name-change", update);
  }, []);
  const fortune = useMemo(() => getDailyFortune(name), [name]);

  return (
    <section className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur animate-float-up animate-glow-soft">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">運勢</h2><span className="text-2xl animate-drift">✨</span></div>
      <p className="mb-3 text-4xl font-extrabold text-indigo-600">{fortune.rank}</p>
      <p className="mb-5 leading-relaxed text-slate-700">{fortune.message}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">ラッキーカラー</p><p className="text-lg font-semibold">{fortune.color}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">ラッキーアクション</p><p className="text-lg font-semibold">{fortune.action}</p></div>
      </div>
    </section>
  );
}
