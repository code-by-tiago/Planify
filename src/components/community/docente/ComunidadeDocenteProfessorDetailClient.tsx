"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityProfilePanel } from "@/components/community/CommunityProfilePanel";
import { CommunityPublicProfile } from "@/components/community/docente/CommunityPublicProfile";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import type { CommunityTeacherDetail } from "@/server/community/community-docente-service";
import {
  comunidadeRoutes,
  homeWithAba,
  isComunidadeEmbedded,
} from "@/lib/community/docente-utils";

export function ComunidadeDocenteProfessorDetailClient({
  userId,
  forceEmbedded,
}: {
  userId: string;
  forceEmbedded?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedded = isComunidadeEmbedded(searchParams, forceEmbedded);
  const homeHref = homeWithAba("professores", embedded);

  const [teacher, setTeacher] = useState<CommunityTeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messaging, setMessaging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/community/docente/professor/${userId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Perfil não encontrado.");
      }
      setTeacher(data.teacher);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFollow = async () => {
    if (!teacher || teacher.isOwnProfile) return;
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "follow", followingId: userId }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      setTeacher((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: data.following,
              profile: {
                ...prev.profile,
                isFollowing: data.following,
                followersCount: data.following
                  ? prev.profile.followersCount + 1
                  : Math.max(0, prev.profile.followersCount - 1),
              },
            }
          : prev,
      );
    }
  };

  const handleMessage = async () => {
    if (!teacher || teacher.isOwnProfile || messaging) return;
    setMessaging(true);
    try {
      const response = await fetch("/api/community/messages/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        router.push(comunidadeRoutes.messages);
      }
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="professores"
        breadcrumbs={[{ label: "Professores", href: homeHref }]}
        title="Carregando…"
      >
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  if (error || !teacher) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="professores"
        breadcrumbs={[{ label: "Professores", href: homeHref }]}
        title="Professor"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error || "Perfil não encontrado."}</p>
          <button
            type="button"
            onClick={() => router.push(comunidadeRoutes.busca)}
            className="mt-3 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Buscar professores
          </button>
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  const { profile } = teacher;

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      wide
      activeMenu={teacher.isOwnProfile ? "inicio" : "professores"}
      breadcrumbs={teacher.isOwnProfile ? [] : [{ label: "Professores", href: homeHref }]}
      title={teacher.isOwnProfile ? "Meu perfil" : profile.name}
      subtitle={undefined}
    >
      {teacher.isOwnProfile ? (
        <CommunityProfilePanel />
      ) : (
        <CommunityPublicProfile
          teacher={teacher}
          embedded={embedded}
          onFollow={() => void handleFollow()}
          onMessage={() => void handleMessage()}
          messaging={messaging}
        />
      )}
    </ComunidadeDocenteDetailShell>
  );
}
