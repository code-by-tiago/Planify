import type { Metadata } from "next";
import { Suspense } from "react";
import { ComunidadeDocenteEventoDetailClient } from "@/components/community/docente/ComunidadeDocenteEventoDetailClient";
import { getCommunityEventDetail } from "@/server/community/community-docente-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getCommunityEventDetail({ eventId: id });
  const title = event?.title || "Evento";
  const description =
    event?.description?.slice(0, 160) ||
    "Evento da Comunidade Docente Planify para professores.";

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

export default async function EventoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
        <ComunidadeDocenteEventoDetailClient eventId={id} />
      </Suspense>
  );
}
