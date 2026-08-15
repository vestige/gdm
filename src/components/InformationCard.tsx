import type { InformationCardDefinition } from "./information-card-types";

type InformationCardProps = {
  definition: InformationCardDefinition;
  summary: string;
  onSelect: (definition: InformationCardDefinition) => void;
};

export default function InformationCard({ definition, summary, onSelect }: InformationCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(definition)}
      className="group flex min-h-44 w-full flex-col rounded-3xl border border-white/70 bg-white/80 p-5 text-left shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <span className="text-3xl" aria-hidden="true">{definition.icon}</span>
      <span className="mt-4 text-lg font-bold text-slate-800">{definition.title}</span>
      {definition.description && <span className="mt-1 text-xs text-slate-500">{definition.description}</span>}
      <span className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{summary}</span>
      <span className="mt-auto self-end text-xl text-indigo-500 transition group-hover:translate-x-1" aria-hidden="true">→</span>
    </button>
  );
}
