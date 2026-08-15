import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InformationCard from "./InformationCard";
import InformationModal from "./InformationModal";
import type { InformationCardDefinition } from "./information-card-types";

type InformationCardGridProps = {
  definitions: InformationCardDefinition[];
};

function readSummary(definition: InformationCardDefinition): string {
  if ("text" in definition.summary) return definition.summary.text;
  const values = definition.summary.selectors
    .map((selector) => document.querySelector<HTMLElement>(selector)?.textContent?.trim())
    .filter((value): value is string => Boolean(value && value !== "---" && !value.includes("読み込み中")));
  return values.length ? values.join(" / ") : definition.summary.fallback;
}

export default function InformationCardGrid({ definitions }: InformationCardGridProps) {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<InformationCardDefinition | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>(() =>
    Object.fromEntries(definitions.map((definition) => [definition.id, readSummary(definition)]))
  );

  useEffect(() => {
    const update = () => setSummaries(Object.fromEntries(definitions.map((definition) => [definition.id, readSummary(definition)])));
    const observer = new MutationObserver(update);
    definitions.forEach((definition) => {
      if ("text" in definition.summary) return;
      definition.summary.selectors.forEach((selector) => {
        const target = document.querySelector(selector);
        if (target) observer.observe(target, { childList: true, characterData: true, subtree: true });
      });
    });
    update();
    return () => observer.disconnect();
  }, [definitions]);

  const selectCard = (definition: InformationCardDefinition) => {
    if (definition.action.type === "route") navigate(definition.action.path);
    else setActiveModal(definition);
  };

  return (
    <>
      <div className="information-card-grid grid gap-4">
        {definitions.map((definition) => (
          <InformationCard key={definition.id} definition={definition} summary={summaries[definition.id] ?? ("text" in definition.summary ? definition.summary.text : definition.summary.fallback)} onSelect={selectCard} />
        ))}
      </div>
      <InformationModal definition={activeModal} onClose={() => setActiveModal(null)} />
    </>
  );
}
