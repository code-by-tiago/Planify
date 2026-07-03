"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { CommunityMessagesIcon } from "@/components/community/CommunityMessagesIcon";
import { CommunityProfileBioField, CommunityProfileBioTopics } from "@/components/community/CommunityProfileBio";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { IconArrowRight, IconSearch, IconTrophy } from "@/components/community/docente/docente-icons";
import type { CommunityTeacherDetail } from "@/server/community/community-docente-service";
import type { DocenteBadgeProgress } from "@/lib/community/docente-types";
import { normalizeCommunityBio } from "@/lib/community/profile-bio";
import {
  DOCENTE_DISCIPLINAS,
  comunidadeRoutes,
  formatDocenteNumber,
  formatDocenteTimeAgo,
  homeWithAba,
  isComunidadeEmbedded,
} from "@/lib/community/docente-utils";
import { parseJsonResponse } from "@/lib/http/parse-json-response";

type CommunityProfileStats = {
  classesCount: number;
  materialsCount: number;
  followersCount: number;
  followingCount: number;
};

type CommunityProfile = {
  userId: string;
  fullName: string;
  email: string;
  schoolName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  communityPublic: boolean;
  teachingAreas?: string[];
  topComponentes?: string[];
  stats: CommunityProfileStats;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function ComunidadeMeuPerfilClient({ forceEmbedded }: { forceEmbedded?: boolean } = {}) {
  const searchParams = useSearchParams();
  const embedded = isComunidadeEmbedded(searchParams, forceEmbedded);

  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [detail, setDetail] = useState<CommunityTeacherDetail | null>(null);
  const [badgeProgress, setBadgeProgress] = useState<DocenteBadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [portfolioTab, setPortfolioTab] = useState<"materiais" | "discussoes" | "grupos">("materiais");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState({
    fullName: "",
    schoolName: "",
    bio: "",
    communityPublic: true,
    teachingAreas: [] as string[],
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const profileResponse = await fetch("/api/community/profile", {
        cache: "no-store",
        credentials: "include",
      });
      const profileData = await parseJsonResponse<{
        profile?: CommunityProfile;
        error?: { message?: string };
      }>(profileResponse);

      if (!profileResponse.ok || !profileData?.profile) {
        throw new Error(
          profileData?.error?.message || "Faça login para ver seu perfil na comunidade.",
        );
      }

      setProfile(profileData.profile);
      setDraft({
        fullName: profileData.profile.fullName || "",
        schoolName: profileData.profile.schoolName || "",
        bio: profileData.profile.bio || "",
        communityPublic: profileData.profile.communityPublic !== false,
        teachingAreas:
          profileData.profile.teachingAreas || profileData.profile.topComponentes || [],
      });

      const userId = profileData.profile.userId;
      const [detailResult, overviewResult] = await Promise.allSettled([
        fetch(`/api/community/docente/professor/${userId}`, {
          credentials: "include",
          cache: "no-store",
        }).then((r) => r.json()),
        fetch("/api/community/docente", {
          credentials: "include",
          cache: "no-store",
        }).then((r) => r.json()),
      ]);

      if (detailResult.status === "fulfilled" && detailResult.value?.ok) {
        setDetail(detailResult.value.teacher || null);
      }
      if (overviewResult.status === "fulfilled" && overviewResult.value?.ok) {
        setBadgeProgress(overviewResult.value.badgeProgress || []);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erro ao carregar o perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const saveCommunityVisibility = useCallback(async (nextPublic: boolean) => {
    setSavingVisibility(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/community/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityPublic: nextPublic }),
      });
      const data = await parseJsonResponse<{
        profile?: CommunityProfile;
        error?: { message?: string };
      }>(response);

      if (!response.ok || !data?.profile) {
        throw new Error(data?.error?.message || "Não foi possível atualizar a visibilidade.");
      }

      setProfile(data.profile);
      setDraft((current) => ({ ...current, communityPublic: nextPublic }));
      setStatus(nextPublic ? "Perfil visível na comunidade." : "Perfil oculto na comunidade.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar visibilidade.");
    } finally {
      setSavingVisibility(false);
    }
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/community/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: draft.fullName,
          schoolName: draft.schoolName || null,
          bio: normalizeCommunityBio(draft.bio),
          communityPublic: draft.communityPublic,
          teachingAreas: draft.teachingAreas,
        }),
      });
      const data = await parseJsonResponse<{
        profile?: CommunityProfile;
        error?: { message?: string };
      }>(response);

      if (!response.ok || !data?.profile) {
        throw new Error(data?.error?.message || "Não foi possível salvar o perfil.");
      }

      setProfile(data.profile);
      setEditing(false);
      setStatus("Perfil atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) return;

    setUploadingAvatar(true);
    setError("");

    try {
      const body = new FormData();
      body.set("avatar", file);

      const response = await fetch("/api/community/profile/avatar", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await parseJsonResponse<{
        profile?: CommunityProfile;
        error?: { message?: string };
      }>(response);

      if (!response.ok || !data?.profile) {
        throw new Error(
          data?.error?.message ||
            (response.status === 413
              ? "A imagem é grande demais (máx. 2 MB)."
              : "Não foi possível enviar a foto."),
        );
      }

      setProfile(data.profile);
      setStatus("Foto atualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function shareProfile() {
    if (!profile) return;
    const url = `${window.location.origin}/comunidade/professor/${profile.userId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setStatus("Link do seu perfil copiado.");
    });
  }

  const earnedBadges = useMemo(
    () => badgeProgress.filter((badge) => badge.earned),
    [badgeProgress],
  );

  const filteredMaterials = useMemo(() => {
    const list = detail?.materials || [];
    const q = portfolioSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => `${m.title} ${m.disciplina}`.toLowerCase().includes(q));
  }, [detail, portfolioSearch]);

  const filteredDiscussions = useMemo(() => {
    const list = detail?.discussions || [];
    const q = portfolioSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => `${d.title} ${d.disciplina}`.toLowerCase().includes(q));
  }, [detail, portfolioSearch]);

  const filteredGroups = useMemo(() => {
    const list = detail?.groups || [];
    const q = portfolioSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((g) => `${g.name} ${g.disciplina}`.toLowerCase().includes(q));
  }, [detail, portfolioSearch]);

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="inicio"
        breadcrumbs={[{ label: "Meu perfil" }]}
        title="Carregando…"
      >
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  if (loadError || !profile) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="inicio"
        breadcrumbs={[{ label: "Meu perfil" }]}
        title="Meu perfil"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">
            {loadError || "Não foi possível carregar seu perfil."}
          </p>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="mt-3 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Tentar novamente
          </button>
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  const displayName = editing ? draft.fullName : profile.fullName;
  const displaySchool = editing ? draft.schoolName : profile.schoolName || "";
  const displayBio = editing ? draft.bio : profile.bio;
  const isPublic = editing ? draft.communityPublic : profile.communityPublic;
  const teachingAreas = profile.teachingAreas || profile.topComponentes || [];

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      activeMenu="inicio"
      breadcrumbs={[{ label: "Meu perfil" }]}
      title="Meu perfil"
      subtitle="Gerencie como você aparece para outros professores na comunidade."
    >
      {/* Header card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-32 bg-gradient-to-r from-cyan-100 via-indigo-50 to-violet-100 sm:h-40">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(34,211,238,0.35) 0, transparent 45%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.25) 0, transparent 40%), radial-gradient(circle at 60% 80%, rgba(14,165,233,0.2) 0, transparent 40%)",
            }}
          />
          <div className="absolute right-4 top-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shareProfile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white"
            >
              <PlanifyIcon name="externalLink" className="h-3.5 w-3.5" />
              Compartilhar
            </button>
            <button
              type="button"
              onClick={() => {
                if (editing) {
                  void saveProfile();
                } else {
                  setEditing(true);
                }
              }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
            >
              <PlanifyIcon name="pen" className="h-3.5 w-3.5" />
              {editing ? (saving ? "Salvando…" : "Salvar perfil") : "Editar perfil"}
            </button>
          </div>
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="group relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg sm:mx-0"
              title="Alterar foto"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                  {initialsFromName(displayName)}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-[10px] font-bold text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
                {uploadingAvatar ? "…" : "Alterar foto"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                void handleAvatarChange(file);
                event.currentTarget.value = "";
              }}
            />

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              {editing ? (
                <input
                  value={draft.fullName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-cyan-400/25 bg-white px-3 py-2 text-2xl font-extrabold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Seu nome"
                />
              ) : (
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  {displayName}
                </h2>
              )}

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <PlanifyIcon name="library" className="h-4 w-4 shrink-0 text-slate-400" />
                {editing ? (
                  <input
                    value={draft.schoolName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, schoolName: event.target.value }))
                    }
                    className="w-full min-w-0 flex-1 rounded-lg border border-cyan-400/20 px-2.5 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 sm:min-w-[12rem]"
                    placeholder="Nome da escola"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-600">
                    {displaySchool || "Adicione sua escola no perfil"}
                  </p>
                )}
              </div>

              {!editing && teachingAreas.length > 0 ? (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                  {teachingAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-cyan-400/25 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold text-cyan-800"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {editing ? (
            <CommunityProfileBioField
              className="mt-5"
              value={draft.bio}
              onChange={(bio) => setDraft((current) => ({ ...current, bio }))}
            />
          ) : (
            <CommunityProfileBioTopics
              className="mt-5"
              bio={displayBio}
              emptyMessage="Adicione uma breve descrição sobre sua atuação pedagógica."
            />
          )}

          {editing ? (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-500">Áreas de atuação</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DOCENTE_DISCIPLINAS.map((disciplina) => {
                  const selected = draft.teachingAreas.includes(disciplina);
                  return (
                    <button
                      key={disciplina}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          teachingAreas: selected
                            ? current.teachingAreas.filter((item) => item !== disciplina)
                            : [...current.teachingAreas, disciplina],
                        }))
                      }
                      className={[
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition",
                        selected
                          ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300",
                      ].join(" ")}
                    >
                      {disciplina}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-center sm:grid-cols-4">
            {(
              [
                [profile.stats.classesCount, "Turmas"],
                [profile.stats.materialsCount, "Materiais"],
                [profile.stats.followersCount, "Seguidores"],
                [profile.stats.followingCount, "Seguindo"],
              ] as const
            ).map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-xl font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(value)}
                </p>
                <p className="text-[11px] font-semibold text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/15 bg-cyan-50/40 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <PlanifyIcon name="message" className="h-4 w-4 text-cyan-600" />
              Mensagens com amigos
            </div>
            <CommunityMessagesIcon className="relative inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-white px-3 py-1.5 text-xs font-bold text-cyan-800 shadow-sm transition hover:bg-cyan-50" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/15 bg-cyan-50/40 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <PlanifyIcon name="infoCircle" className="h-4 w-4 text-cyan-600" />
              Perfil público
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {isPublic ? "Visível" : "Oculto"}
              </span>
              <span className="relative inline-flex h-6 w-11 items-center">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={isPublic}
                  checked={isPublic}
                  disabled={savingVisibility || saving}
                  onChange={(event) => {
                    const nextPublic = event.target.checked;
                    if (editing) {
                      setDraft((current) => ({ ...current, communityPublic: nextPublic }));
                      return;
                    }
                    void saveCommunityVisibility(nextPublic);
                  }}
                  className="peer sr-only"
                />
                <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-gradient-to-r peer-checked:from-cyan-600 peer-checked:to-blue-600 peer-disabled:opacity-60" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          {editing ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft({
                    fullName: profile.fullName || "",
                    schoolName: profile.schoolName || "",
                    bio: profile.bio || "",
                    communityPublic: profile.communityPublic !== false,
                    teachingAreas: profile.teachingAreas || profile.topComponentes || [],
                  });
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </p>
          ) : null}
          {status ? (
            <p className="mt-3 text-xs font-semibold text-emerald-700">{status}</p>
          ) : null}
        </div>
      </section>

      {/* Conquistas */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#0F172A]">
            <IconTrophy className="h-4 w-4 text-amber-500" />
            Conquistas
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
              {earnedBadges.length}/{badgeProgress.length}
            </span>
          </h2>
          <Link
            href={embedded ? comunidadeRoutes.desafiosEmbedded : comunidadeRoutes.desafios}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 transition hover:text-cyan-800"
          >
            Ver desafios
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {badgeProgress.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Participe da comunidade para desbloquear selos e conquistas.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {badgeProgress.map((badge) => (
              <div
                key={badge.id}
                className={[
                  "flex flex-col items-center rounded-2xl border p-4 text-center transition",
                  badge.earned
                    ? "border-amber-200/70 bg-amber-50/40"
                    : "border-slate-100 bg-slate-50/60 opacity-60 grayscale",
                ].join(" ")}
                title={badge.description}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ backgroundColor: badge.color }}
                >
                  <IconTrophy className="h-5 w-5" />
                </span>
                <p className="mt-2 line-clamp-1 text-xs font-extrabold text-[#0F172A]">
                  {badge.name}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                  {badge.earned
                    ? badge.awardedAt
                      ? `Conquistado ${formatDocenteTimeAgo(badge.awardedAt)}`
                      : "Conquistado"
                    : badge.progress[0]
                      ? `${badge.progress[0].current}/${badge.progress[0].target} ${badge.progress[0].label}`
                      : "Bloqueado"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Publicações recentes */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Publicações recentes</h2>
        {(detail?.discussions || []).length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Você ainda não publicou nada na comunidade.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Compartilhe uma discussão ou material e apareça aqui.
            </p>
            <Link
              href={embedded ? comunidadeRoutes.homeEmbedded : comunidadeRoutes.home}
              className="mt-4 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-200/50 transition hover:bg-cyan-600"
            >
              Conhecer a comunidade
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {(detail?.discussions || []).slice(0, 5).map((discussion) => (
              <li key={discussion.id}>
                <Link
                  href={comunidadeRoutes.discussao(discussion.id, embedded)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200 hover:bg-cyan-50/20"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-[#0F172A]">
                      {discussion.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {discussion.disciplina} · {formatDocenteTimeAgo(discussion.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-400">
                    {formatDocenteNumber(discussion.likesCount)} curtidas ·{" "}
                    {formatDocenteNumber(discussion.commentsCount)} comentários
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Portfólio */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Portfólio</h2>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={portfolioSearch}
              onChange={(event) => setPortfolioSearch(event.target.value)}
              placeholder="Buscar no portfólio..."
              className="h-9 w-52 rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs font-medium text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {(
            [
              ["materiais", "Materiais"],
              ["discussoes", "Discussões"],
              ["grupos", "Grupos"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPortfolioTab(tab)}
              className={[
                "rounded-xl px-4 py-2 text-xs font-bold transition",
                portfolioTab === tab
                  ? "bg-[#0F172A] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {portfolioTab === "materiais" ? (
          filteredMaterials.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nenhum material publicado ainda.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {filteredMaterials.map((material) => (
                <li key={material.id}>
                  <Link
                    href={comunidadeRoutes.material(material.id, embedded)}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200 hover:bg-cyan-50/20"
                  >
                    <span className="line-clamp-1 font-semibold text-[#0F172A]">
                      {material.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDocenteNumber(material.downloadsCount)} downloads
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {portfolioTab === "discussoes" ? (
          filteredDiscussions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nenhuma discussão publicada ainda.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {filteredDiscussions.map((discussion) => (
                <li key={discussion.id}>
                  <Link
                    href={comunidadeRoutes.discussao(discussion.id, embedded)}
                    className="block rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200"
                  >
                    <p className="line-clamp-1 font-semibold text-[#0F172A]">{discussion.title}</p>
                    <p className="text-xs text-slate-400">
                      {formatDocenteTimeAgo(discussion.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {portfolioTab === "grupos" ? (
          filteredGroups.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Você ainda não participa de grupos.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {filteredGroups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={comunidadeRoutes.grupo(group.id, embedded)}
                    className="block rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200"
                  >
                    <p className="line-clamp-1 font-semibold text-[#0F172A]">{group.name}</p>
                    <p className="text-xs text-slate-400">
                      {group.disciplina} · {formatDocenteNumber(group.membersCount)} membros
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </ComunidadeDocenteDetailShell>
  );
}
