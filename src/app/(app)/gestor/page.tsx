import type { Metadata } from "next";
import { DirectorPanelClient } from "@/components/bncc/DirectorPanelClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do Gestor | Planify",
  description:
    "Visão administrativa de turmas, professores e conformidade BNCC da escola.",
};

export default function GestorPage() {
  return <DirectorPanelClient />;
}
