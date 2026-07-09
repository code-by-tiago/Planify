"use client";

import { useSearchParams } from "next/navigation";
import ComunidadeDocenteClient from "@/components/community/docente/ComunidadeDocenteClient";
import { ComunidadeDocenteBuscaClient } from "@/components/community/docente/ComunidadeDocenteBuscaClient";
import { ComunidadeDocenteDesafiosPageClient } from "@/components/community/docente/ComunidadeDocenteDesafiosPageClient";
import { ComunidadeDocenteDiscussaoDetailClient } from "@/components/community/docente/ComunidadeDocenteDiscussaoDetailClient";
import { ComunidadeDocenteMaterialDetailClient } from "@/components/community/docente/ComunidadeDocenteMaterialDetailClient";
import { ComunidadeDocenteProfessorDetailClient } from "@/components/community/docente/ComunidadeDocenteProfessorDetailClient";

export function ComunidadeDashboardRouter() {
  const searchParams = useSearchParams();
  const view = searchParams.get("comunidadeView");
  const id = searchParams.get("comunidadeId") || "";

  if (view === "discussao" && id) {
    return <ComunidadeDocenteDiscussaoDetailClient postId={id} forceEmbedded />;
  }
  if (view === "professor" && id) {
    return <ComunidadeDocenteProfessorDetailClient userId={id} forceEmbedded />;
  }
  if (view === "material" && id) {
    return <ComunidadeDocenteMaterialDetailClient materialId={id} forceEmbedded />;
  }
  if (view === "desafios") {
    return <ComunidadeDocenteDesafiosPageClient forceEmbedded />;
  }
  if (view === "busca") {
    return <ComunidadeDocenteBuscaClient forceEmbedded />;
  }

  return <ComunidadeDocenteClient embedded />;
}
