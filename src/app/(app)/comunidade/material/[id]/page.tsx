import type { Metadata } from "next";
import { Suspense } from "react";
import { ComunidadeDocenteMaterialDetailClient } from "@/components/community/docente/ComunidadeDocenteMaterialDetailClient";
import { getCommunityMaterialMeta } from "@/server/community/community-docente-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await getCommunityMaterialMeta(id);
  const title = material?.title || "Material";
  const description =
    material?.description?.slice(0, 160) ||
    (material?.componente
      ? `Material de ${material.componente} compartilhado na Comunidade Docente Planify.`
      : "Material pedagógico compartilhado na Comunidade Docente Planify.");

  return {
    title: `${title} | Comunidade Docente Planify`,
    description,
    openGraph: {
      title: `${title} | Comunidade Docente`,
      description,
      type: "article",
    },
  };
}

export default async function MaterialDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
        <ComunidadeDocenteMaterialDetailClient materialId={id} />
      </Suspense>
  );
}
