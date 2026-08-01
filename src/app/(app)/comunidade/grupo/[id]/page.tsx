import type { Metadata } from "next";
import { Suspense } from "react";
import { ComunidadeDocenteGrupoDetailClient } from "@/components/community/docente/ComunidadeDocenteGrupoDetailClient";
import { getCommunityGroupDetail } from "@/server/community/community-docente-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const group = await getCommunityGroupDetail({ groupId: id });
  const title = group?.name || "Grupo";
  const description =
    group?.description?.slice(0, 160) ||
    "Grupo de estudo na Comunidade Docente Planify.";

  return {
    title: `${title} | Comunidade Docente Planify`,
    description,
    openGraph: {
      title: `${title} | Comunidade Docente`,
      description,
      type: "website",
    },
  };
}

export default async function GrupoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
        <ComunidadeDocenteGrupoDetailClient groupId={id} />
      </Suspense>
  );
}
