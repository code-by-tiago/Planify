import type { Metadata } from "next";
import { GestorPageLoader } from "@/components/bncc/GestorPageLoader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professores | Painel do Gestor | Planify",
  description: "Gerencie professores vinculados à escola.",
};

export default function GestorProfessoresPage() {
  return <GestorPageLoader />;
}
