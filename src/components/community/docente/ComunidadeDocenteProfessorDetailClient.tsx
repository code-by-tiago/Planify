"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import type { CommunityTeacherDetail } from "@/server/community/community-docente-service";
import {
  comunidadeRoutes,
  formatDocenteNumber,
  formatDocenteTimeAgo,
} from "@/lib/community/docente-utils";

export function ComunidadeDocenteProfessorDetailClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<CommunityTeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        activeMenu="professores"
        breadcrumbs={[{ label: "Professores", href: comunidadeRoutes.busca }]}
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
        activeMenu="professores"
        breadcrumbs={[{ label: "Professores", href: comunidadeRoutes.busca }]}
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
      activeMenu="professores"
      breadcrumbs={[{ label: "Professores", href: comunidadeRoutes.busca }]}
      title={profile.name}
      subtitle={teacher.schoolName || profile.specialty}
      actions={
        !teacher.isOwnProfile ? (
          <button
            type="button"
            onClick={() => void handleFollow()}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition",
              teacher.isFollowing
                ? "border border-slate-200 bg-white text-slate-600"
                : "bg-[#0F172A] text-white hover:bg-slate-800",
            ].join(" ")}
          >
            {teacher.isFollowing ? "Seguindo" : "Seguir"}
          </button>
        ) : null
      }
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <CommunityAuthorAvatar
            userId={profile.id}
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            {teacher.bio ? (
              <p className="text-sm leading-relaxed text-slate-600">{teacher.bio}</p>
            ) : null}
            {teacher.topComponentes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {teacher.topComponentes.map((comp) => (
                  <span
                    key={comp}
                    className="rounded-lg bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(profile.materialsCount)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">materiais</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(profile.followersCount)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">seguidores</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(profile.reputation)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">reputação</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {teacher.badges.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Selos conquistados</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {teacher.badges.map((badge) => (
              <span
                key={badge.slug}
                className="rounded-xl px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Materiais publicados</h2>
        {teacher.materials.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nenhum material publicado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {teacher.materials.map((m) => (
              <li key={m.id}>
                <Link
                  href={comunidadeRoutes.material(m.id)}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200 hover:bg-cyan-50/20"
                >
                  <span className="font-semibold text-[#0F172A]">{m.title}</span>
                  <span className="text-xs text-slate-400">
                    {formatDocenteNumber(m.downloadsCount)} downloads
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {teacher.discussions.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Discussões recentes</h2>
          <ul className="mt-4 space-y-2">
            {teacher.discussions.map((d) => (
              <li key={d.id}>
                <Link
                  href={comunidadeRoutes.discussao(d.id)}
                  className="block rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200"
                >
                  <p className="font-semibold text-[#0F172A]">{d.title}</p>
                  <p className="text-xs text-slate-400">{formatDocenteTimeAgo(d.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {teacher.groups.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Grupos</h2>
          <ul className="mt-4 space-y-2">
            {teacher.groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={comunidadeRoutes.grupo(g.id)}
                  className="block rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200"
                >
                  <p className="font-semibold text-[#0F172A]">{g.name}</p>
                  <p className="text-xs text-slate-400">
                    {g.disciplina} · {formatDocenteNumber(g.membersCount)} membros
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ComunidadeDocenteDetailShell>
  );
}
