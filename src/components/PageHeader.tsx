import { Link } from "react-router-dom";

type PageHeaderProps = { title: string; description: string };

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">← ダッシュボード</Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>
    </header>
  );
}
