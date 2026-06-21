import type { Metadata } from "next";
import { TeachyCatalogLayout } from "@/components/teachy-layout";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Ferramentas IA para professores",
  description:
    "Catálogo Planify: slides, provas, listas, planejamentos BNCC, inclusão, correção e mais — 16 geradores pedagógicos com IA.",
  path: "/ferramentas",
});

export default function FerramentasPage() {
  return <TeachyCatalogLayout />;
}
