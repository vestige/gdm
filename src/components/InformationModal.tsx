import { useEffect } from "react";
import LegacySectionHost from "./LegacySectionHost";
import type { InformationCardDefinition } from "./information-card-types";

type InformationModalProps = {
  definition: InformationCardDefinition | null;
  onClose: () => void;
};

export default function InformationModal({ definition, onClose }: InformationModalProps) {
  useEffect(() => {
    if (!definition) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [definition, onClose]);

  if (!definition || definition.action.type !== "modal") return null;

  return (
    <div className="information-modal fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center" data-card-id={definition.id} role="dialog" aria-modal="true" aria-label={definition.title} onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-slate-50 p-3 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-2">
          <h2 className="text-lg font-bold text-slate-800">{definition.title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-100" aria-label="閉じる">✕</button>
        </div>
        <div className="grid gap-4">
          {definition.action.content}
          {definition.action.targetIds?.map((targetId) => <LegacySectionHost key={targetId} targetId={targetId} />)}
        </div>
      </div>
    </div>
  );
}
