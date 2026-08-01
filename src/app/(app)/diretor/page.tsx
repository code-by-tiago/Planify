import type { Metadata } from "next";
import { GestorPageLoader } from "@/components/bncc/GestorPageLoader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do Gestor | Planify",
  description:
    "Visão administrativa de turmas, professores e conformidade BNCC da escola.",
};

export default function DiretorPage() {
  return <GestorPageLoader />;
}
