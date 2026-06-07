import type { Metadata } from "next";
import { GestorPageLoader } from "@/components/bncc/GestorPageLoader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turmas | Painel do Gestor | Planify",
  description: "Cadastre e gerencie turmas da escola.",
};

export default function GestorTurmasPage() {
  return <GestorPageLoader />;
}
