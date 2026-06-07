import type { Metadata } from "next";
import { GestorPageLoader } from "@/components/bncc/GestorPageLoader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Materiais | Painel do Gestor | Planify",
  description: "Auditoria de materiais produzidos pelos professores da escola.",
};

export default function GestorMateriaisPage() {
  return <GestorPageLoader />;
}
