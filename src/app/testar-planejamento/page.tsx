import type { Metadata } from "next";
import { TestarPlanejamentoShell } from "./TestarPlanejamentoShell";

export const metadata: Metadata = {
  title: "Testar planejamento grátis | Planify",
  description:
    "Gere um pacote de teste BNCC (anual + trimestres coerentes), visualize os documentos completos e conheça o Planify Pro.",
};

export default function TestarPlanejamentoPage() {
  return <TestarPlanejamentoShell />;
}
