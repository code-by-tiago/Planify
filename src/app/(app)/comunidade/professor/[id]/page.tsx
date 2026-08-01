import type { Metadata } from "next";
import { Suspense } from "react";
import { ComunidadeDocenteProfessorDetailClient } from "@/components/community/docente/ComunidadeDocenteProfessorDetailClient";
import { getCommunityTeacherDetail } from "@/server/community/community-docente-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const teacher = await getCommunityTeacherDetail({ userId: id });
  const name = teacher?.profile.name || "Professor(a)";
  const description =
    teacher?.profile.specialty ||
    "Perfil público na Comunidade Docente Planify — materiais, discussões e grupos.";

  return {
    title: `${name} | Comunidade Docente Planify`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${name} | Comunidade Docente`,
      description: description.slice(0, 160),
      type: "profile",
    },
  };
}

export default async function ProfessorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
        <ComunidadeDocenteProfessorDetailClient userId={id} />
      </Suspense>
  );
}
