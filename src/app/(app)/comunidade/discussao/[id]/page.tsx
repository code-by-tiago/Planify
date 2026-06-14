import type { Metadata } from "next";
import { Suspense } from "react";
import { ComunidadeDocenteDiscussaoDetailClient } from "@/components/community/docente/ComunidadeDocenteDiscussaoDetailClient";
import { getCommunityDiscussionDetail } from "@/server/community/community-docente-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const discussion = await getCommunityDiscussionDetail({ postId: id });
  const title = discussion?.title || "Discussão";
  const description =
    discussion?.body?.slice(0, 160) ||
    "Discussão na Comunidade Docente Planify — troca de ideias entre professores.";

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

export default async function DiscussaoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
        <ComunidadeDocenteDiscussaoDetailClient postId={id} />
      </Suspense>
  );
}
