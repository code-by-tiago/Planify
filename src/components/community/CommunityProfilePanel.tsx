"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { CommunityProfileBioField, CommunityProfileBioTopics } from "@/components/community/CommunityProfileBio";
import { normalizeCommunityBio } from "@/lib/community/profile-bio";
import { DOCENTE_DISCIPLINAS, comunidadeRoutes, formatDocenteNumber } from "@/lib/community/docente-utils";
import { parseJsonResponse } from "@/lib/http/parse-json-response";

type BadgeProgressItem = {
  id: string;
  slug: string;
  name: string;
  color: string;
  earned: boolean;
};

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
  coverUrl: string | null;
  communityPublic: boolean;
  teachingAreas?: string[];
  topComponentes?: string[];
  stats: CommunityProfileStats;
};

type PortfolioMaterial = {
  id: string;
  title: string;
  disciplina: string;
  downloadsCount: number;
};

type RecentPost = {
  id: string;
  title: string;
  createdAt: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

const DEFAULT_COVER =
  "radial-gradient(circle at 18% 40%, rgba(167,139,250,0.45) 0, transparent 42%), radial-gradient(circle at 82% 30%, rgba(96,165,250,0.35) 0, transparent 40%), linear-gradient(135deg, #ede9fe 0%, #e0e7ff 45%, #fce7f3 100%)";

export function CommunityProfilePanel() {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [badges, setBadges] = useState<BadgeProgressItem[]>([]);
  const [portfolioMaterials, setPortfolioMaterials] = useState<PortfolioMaterial[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState({
    fullName: "",
    schoolName: "",
    bio: "",
    communityPublic: true,
    teachingAreas: [] as string[],
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/community/profile", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        profile?: CommunityProfile;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar o perfil.");
      }

      if (!data?.profile) {
        throw new Error("Resposta inválida ao carregar o perfil.");
      }

      setProfile(data.profile);
      setDraft({
        fullName: data.profile.fullName || "",
        schoolName: data.profile.schoolName || "",
        bio: data.profile.bio || "",
        communityPublic: data.profile.communityPublic !== false,
        teachingAreas: data.profile.teachingAreas || data.profile.topComponentes || [],
      });

      void fetch(`/api/community/docente/professor/${data.profile.userId}`, {
        credentials: "include",
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((teacherData) => {
          if (teacherData?.ok && teacherData.teacher) {
            setPortfolioMaterials(teacherData.teacher.materials || []);
            setRecentPosts(
              (teacherData.teacher.discussions || []).map(
                (d: { id: string; title: string; createdAt: string }) => ({
                  id: d.id,
                  title: d.title,
                  createdAt: d.createdAt,
                }),
              ),
            );
          }
        })
        .catch(() => {});
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    void fetch("/api/community/docente", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.badgeProgress)) {
          setBadges(
            data.badgeProgress.map((b: BadgeProgressItem) => ({
              id: b.id,
              slug: b.slug,
              name: b.name,
              color: b.color,
              earned: Boolean(b.earned),
            })),
          );
        }
      })
      .catch(() => {});
  }, [loadProfile]);

  async function saveCommunityVisibility(nextPublic: boolean) {
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

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível atualizar a visibilidade.");
      }

      if (!data?.profile) {
        throw new Error("Resposta inválida ao atualizar visibilidade.");
      }

      setProfile(data.profile);
      setDraft((current) => ({ ...current, communityPublic: nextPublic }));
      setStatus(nextPublic ? "Perfil visível na comunidade." : "Perfil oculto na comunidade.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar visibilidade.");
    } finally {
      setSavingVisibility(false);
    }
  }

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

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível salvar o perfil.");
      }

      if (!data?.profile) {
        throw new Error("Resposta inválida ao salvar o perfil.");
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

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            (response.status === 413
              ? "A imagem é grande demais (máx. 2 MB)."
              : "Não foi possível enviar a foto."),
        );
      }

      if (!data?.profile) {
        throw new Error("Resposta inválida ao enviar a foto.");
      }

      setProfile(data.profile);
      setStatus("Foto atualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCoverChange(file: File | null) {
    if (!file) return;

    setUploadingCover(true);
    setError("");

    try {
      const body = new FormData();
      body.set("cover", file);

      const response = await fetch("/api/community/profile/cover", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await parseJsonResponse<{
        profile?: CommunityProfile;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            (response.status === 413
              ? "A imagem é grande demais (máx. 4 MB)."
              : "Não foi possível enviar a capa."),
        );
      }

      if (!data?.profile) {
        throw new Error("Resposta inválida ao enviar a capa.");
      }

      setProfile(data.profile);
      setStatus("Capa atualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar capa.");
    } finally {
      setUploadingCover(false);
    }
  }

  function shareProfile() {
    if (!profile) return;
    const url = `${window.location.origin}/comunidade/professor/${profile.userId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setStatus("Link do seu perfil copiado.");
    });
  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-slate-500">
        Carregando seu perfil…
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
        {error || "Faça login para personalizar seu perfil na Comunidade."}
      </section>
    );
  }

  const displayName = editing ? draft.fullName : profile.fullName;
  const displaySchool = editing ? draft.schoolName : profile.schoolName || "";
  const displayBio = editing ? draft.bio : profile.bio;
  const isPublic = editing ? draft.communityPublic : profile.communityPublic;
  const areas = editing
    ? draft.teachingAreas
    : profile.teachingAreas || profile.topComponentes || [];

  const filteredPortfolio = portfolioQuery.trim()
    ? portfolioMaterials.filter((m) =>
        m.title.toLowerCase().includes(portfolioQuery.trim().toLowerCase()),
      )
    : portfolioMaterials;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        <div className="relative h-36 sm:h-44">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: DEFAULT_COVER }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute right-3 top-3 flex flex-wrap gap-2 sm:right-4 sm:top-4">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
            >
              <PlanifyIcon name="pen" className="h-3.5 w-3.5" />
              {uploadingCover ? "Enviando…" : "Trocar capa"}
            </button>
            <button
              type="button"
              onClick={shareProfile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white"
            >
              <PlanifyIcon name="externalLink" className="h-3.5 w-3.5" />
              Compartilhar
            </button>
            <button
              type="button"
              onClick={() => {
                if (editing) void saveProfile();
                else setEditing(true);
              }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              <PlanifyIcon name="pen" className="h-3.5 w-3.5" />
              {editing ? (saving ? "Salvando…" : "Salvar perfil") : "Editar perfil"}
            </button>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              void handleCoverChange(file);
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div className="relative px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="group relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg sm:mx-0"
              title="Alterar foto"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
                  {initialsFromName(displayName)}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-[10px] font-bold text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
                {uploadingAvatar ? "…" : "Foto"}
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                void handleAvatarChange(file);
                event.currentTarget.value = "";
              }}
            />

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:pt-2 sm:text-left">
              {editing ? (
                <input
                  value={draft.fullName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xl font-extrabold text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Seu nome"
                />
              ) : (
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
                  {displayName}
                </h2>
              )}

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {editing ? (
                  <input
                    value={draft.schoolName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, schoolName: event.target.value }))
                    }
                    className="w-full min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 sm:min-w-[12rem]"
                    placeholder="Nome da escola"
                  />
                ) : displaySchool ? (
                  <p className="text-sm font-semibold text-slate-600">{displaySchool}</p>
                ) : null}
              </div>

              {!editing && areas.length > 0 ? (
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {areas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600"
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
              className="mt-4"
              value={draft.bio}
              onChange={(bio) => setDraft((current) => ({ ...current, bio }))}
            />
          ) : displayBio ? (
            <CommunityProfileBioTopics className="mt-4" bio={displayBio} emptyMessage="" />
          ) : null}

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
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300",
                      ].join(" ")}
                    >
                      {disciplina}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
            <span>
              <strong className="text-slate-950">{formatDocenteNumber(profile.stats.classesCount)}</strong>{" "}
              Aulas
            </span>
            <span>
              <strong className="text-slate-950">
                {formatDocenteNumber(profile.stats.materialsCount)}
              </strong>{" "}
              Materiais
            </span>
            <span>
              <strong className="text-slate-950">
                {formatDocenteNumber(profile.stats.followersCount)}
              </strong>{" "}
              Seguidores
            </span>
            <span>
              <strong className="text-slate-950">
                {formatDocenteNumber(profile.stats.followingCount)}
              </strong>{" "}
              Seguindo
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              Perfil público
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
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
                <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#2563EB] peer-disabled:opacity-60" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          {editing ? (
            <div className="mt-4 flex justify-end">
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

      {!editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/70 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
                <PlanifyIcon name="shieldCheck" className="h-4 w-4 text-amber-500" />
                Conquistas
              </h3>
              <Link
                href={comunidadeRoutes.desafios}
                className="text-[11px] font-bold text-[#2563EB] hover:text-blue-700"
              >
                Ver todas
              </Link>
            </div>
            {badges.length > 0 ? (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {badges.slice(0, 6).map((badge) => (
                  <div key={badge.id} title={badge.name} className="flex flex-col items-center gap-1">
                    <span
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm",
                        badge.earned ? "text-white shadow-sm" : "bg-slate-100 text-slate-300",
                      ].join(" ")}
                      style={badge.earned ? { backgroundColor: badge.color } : undefined}
                    >
                      <PlanifyIcon name="shieldCheck" className="h-4 w-4" />
                    </span>
                    <span className="line-clamp-2 text-center text-[9px] font-semibold leading-tight text-slate-500">
                      {badge.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs font-medium text-slate-500">
                Participe da comunidade para desbloquear selos.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/70 bg-white p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
              <PlanifyIcon name="checkCircle" className="h-4 w-4 text-[#2563EB]" />
              Certificados
            </h3>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
              Participe de treinamentos sobre IA para professores e receba certificados.
            </p>
            <Link
              href={comunidadeRoutes.desafios}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Ver treinamentos
            </Link>
          </section>
        </div>
      ) : null}

      {!editing ? (
        <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
              <PlanifyIcon name="fileText" className="h-4 w-4 text-[#2563EB]" />
              Publicações recentes
            </h3>
          </div>
          {recentPosts.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm font-medium text-slate-500">
                Faça uma publicação e se junte à comunidade de professores!
              </p>
              <Link
                href="/comunidade"
                className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Conhecer a comunidade
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {recentPosts.slice(0, 5).map((post) => (
                <li key={post.id}>
                  <Link
                    href={comunidadeRoutes.discussao(post.id)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {!editing ? (
        <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
              <PlanifyIcon name="folder" className="h-4 w-4 text-[#2563EB]" />
              Portfólio
            </h3>
          </div>
          <label className="relative mt-3 block max-w-xs">
            <PlanifyIcon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={portfolioQuery}
              onChange={(event) => setPortfolioQuery(event.target.value)}
              placeholder="Buscar..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
          {filteredPortfolio.length === 0 ? (
            <p className="mt-4 text-xs font-medium text-slate-500">
              {portfolioMaterials.length === 0
                ? "Nenhum material publicado ainda."
                : "Nenhum material encontrado para essa busca."}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredPortfolio.map((material) => (
                <Link
                  key={material.id}
                  href={comunidadeRoutes.material(material.id)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex h-20 items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                    <PlanifyIcon name="fileText" className="h-6 w-6" />
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-800 group-hover:text-blue-700">
                      {material.title}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {formatDocenteNumber(material.downloadsCount)} downloads
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
