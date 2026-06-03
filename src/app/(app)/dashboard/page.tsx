import PlanifyStudioShell from "@/components/studio/PlanifyStudioShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio | Planify",
  description:
    "Central de criação pedagógica — materiais com IA, planejamentos BNCC e ferramentas para professoras.",
};

export default function DashboardPage() {
  return <PlanifyStudioShell />;
}
