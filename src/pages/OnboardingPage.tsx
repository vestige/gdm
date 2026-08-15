import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LegacySectionHost from "../components/LegacySectionHost";

export default function OnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const form = document.getElementById("nameForm");
    if (!form) return;
    const openDashboard = () => navigate("/dashboard");
    form.addEventListener("submit", openDashboard);
    return () => form.removeEventListener("submit", openDashboard);
  }, [navigate]);

  return (
    <main className="mx-auto max-w-2xl py-4 md:py-10">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold tracking-widest text-indigo-600">START YOUR MORNING</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">今日の朝をはじめよう</h1>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-slate-600">名前と今日の場所を決めると、あなたの朝のダッシュボードを表示します。</p>
      </header>
      <LegacySectionHost targetId="profileSetupCard" />
      <p className="mt-5 text-center text-xs text-slate-500">名前は任意です。場所と名前はあとからダッシュボードでも変更できます。</p>
    </main>
  );
}
