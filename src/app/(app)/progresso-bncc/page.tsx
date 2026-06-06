import type { Metadata } from "next";
import { BnccProgressClient } from "@/components/bncc/BnccProgressClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Progresso BNCC | Planify",
  description:
    "Acompanhe a cobertura de habilidades BNCC com base nos materiais gerados.",
};

export default function ProgressoBnccPage() {
  return <BnccProgressClient />;
}
