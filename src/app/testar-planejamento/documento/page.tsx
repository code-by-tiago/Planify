import type { Metadata } from "next";
import { PlanningTrialDocumentClient } from "./PlanningTrialDocumentClient";

export const metadata: Metadata = {
  title: "Seu planejamento de teste | Planify",
  description:
    "Visualize o planejamento BNCC gerado no teste gratuito do Planify.",
  robots: { index: false, follow: false },
};

export default function PlanningTrialDocumentPage() {
  return <PlanningTrialDocumentClient />;
}
