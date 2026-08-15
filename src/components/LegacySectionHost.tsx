import { useLayoutEffect, useRef } from "react";

type LegacySectionHostProps = {
  targetId: string;
  className?: string;
};

export default function LegacySectionHost({ targetId, className = "" }: LegacySectionHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const target = document.getElementById(targetId);
    if (!host || !target) return;

    const originalParent = target.parentNode;
    const originalNextSibling = target.nextSibling;
    host.append(target);

    return () => {
      if (!originalParent) return;
      if (originalNextSibling?.parentNode === originalParent) {
        originalParent.insertBefore(target, originalNextSibling);
      } else {
        originalParent.appendChild(target);
      }
    };
  }, [targetId]);

  return <div ref={hostRef} className={`legacy-card-host ${className}`} />;
}
