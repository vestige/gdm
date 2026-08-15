import type { ReactNode } from "react";

export type InformationCardAction =
  | { type: "route"; path: string }
  | { type: "modal"; targetIds: string[] };

export type InformationCardDefinition = {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  summary: {
    selectors: string[];
    fallback: string;
  };
  action: InformationCardAction;
};
