import { useEffect } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { initLegacyApp } from "./legacy-app";
import DashboardPage from "./pages/DashboardPage";
import EnglishPage from "./pages/EnglishPage";
import MoodPage from "./pages/MoodPage";
import OnboardingPage from "./pages/OnboardingPage";
import ReadingPage from "./pages/ReadingPage";
import WeatherPage from "./pages/WeatherPage";

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    document.getElementById("legacyApp")?.classList.add("react-shell-active");
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-5 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to={location.pathname === "/" ? "/" : "/dashboard"} className="inline-flex items-center gap-2 font-extrabold tracking-tight text-slate-800">
          <span className="text-2xl">☀️</span><span>GDM</span>
        </Link>
        {location.pathname !== "/" && location.pathname !== "/dashboard" && <Link to="/dashboard" className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-white">ダッシュボードへ</Link>}
      </div>
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/english" element={<EnglishPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/lucky" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initLegacyApp();
  }, []);

  return <HashRouter><AppShell /></HashRouter>;
}
