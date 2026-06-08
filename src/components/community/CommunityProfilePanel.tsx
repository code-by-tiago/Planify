"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityMessagesIcon } from "@/components/community/CommunityMessagesIcon";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
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
  stats: CommunityProfileStats;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "PL";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function CommunityProfilePanel() {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState({
    fullName: "",
    schoolName: "",
    bio: "",
    communityPublic: true,
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
      });
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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
          bio: draft.bio || null,
          communityPublic: draft.communityPublic,
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
    if (!file) {
      return;
    }

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

  function shareProfile() {
    if (!profile) {
      return;
    }

    const url = `${window.location.origin}/marketplace/perfil/${profile.userId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setStatus("Link do seu perfil copiado.");
    });
  }

  if (loading) {
    return (
      <section className="pl-hud-glass rounded-2xl p-6 text-center text-sm font-semibold text-slate-500">
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
  const displayBio = editing ? draft.bio : profile.bio || "";
  const isPublic = editing ? draft.communityPublic : profile.communityPublic;

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
      <div className="relative h-28 bg-gradient-to-r from-cyan-100 via-indigo-50 to-violet-100 sm:h-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(34,211,238,0.35) 0, transparent 45%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.25) 0, transparent 40%)",
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
            <PlanifyIcon name="settings" className="h-3.5 w-3.5" />
            {editing ? (saving ? "Salvando…" : "Salvar perfil") : "Editar perfil"}
          </button>
        </div>
      </div>

      <div className="relative px-5 pb-5 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="group relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg sm:mx-0"
            title="Alterar foto"
          >
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
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

          <div className="min-w-0 flex-1 text-center sm:pt-2 sm:text-left">
            {editing ? (
              <input
                value={draft.fullName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, fullName: event.target.value }))
                }
                className="w-full rounded-xl border border-cyan-400/25 bg-white px-3 py-2 text-xl font-extrabold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                placeholder="Seu nome"
              />
            ) : (
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
                {displayName}
              </h2>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-lg" aria-hidden>
                🏫
              </span>
              {editing ? (
                <input
                  value={draft.schoolName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, schoolName: event.target.value }))
                  }
                  className="min-w-[12rem] flex-1 rounded-lg border border-cyan-400/20 px-2.5 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400"
                  placeholder="Nome da escola"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-600">
                  {displaySchool || "Adicione sua escola no perfil"}
                </p>
              )}
            </div>
          </div>
        </div>

        {editing ? (
          <textarea
            value={draft.bio}
            onChange={(event) =>
              setDraft((current) => ({ ...current, bio: event.target.value }))
            }
            rows={3}
            maxLength={500}
            placeholder="Conte em poucas linhas sua atuação (componente, etapa, interesses…)"
            className="mt-4 w-full rounded-xl border border-cyan-400/20 bg-slate-50/80 px-3 py-2.5 text-sm font-medium leading-6 text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        ) : displayBio ? (
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{displayBio}</p>
        ) : (
          <p className="mt-4 text-sm font-medium italic text-slate-400">
            Adicione uma breve descrição sobre sua atuação pedagógica.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm font-bold text-slate-700">
          <span>
            <strong className="text-slate-950">{profile.stats.classesCount}</strong> Turmas
          </span>
          <span>
            <strong className="text-slate-950">{profile.stats.materialsCount}</strong> Materiais
          </span>
          <span>
            <strong className="text-slate-950">{profile.stats.followersCount}</strong> Amigos
          </span>
          {profile.stats.followingCount > 0 ? (
            <span>
              <strong className="text-slate-950">{profile.stats.followingCount}</strong>{" "}
              Solicitações
            </span>
          ) : null}
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
                disabled={!editing}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    communityPublic: event.target.checked,
                  }))
                }
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
  );
}
