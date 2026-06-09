"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityBlockButton } from "@/components/community/CommunityBlockButton";
import { CommunityFriendButton } from "@/components/community/CommunityFriendButton";
import { CommunityReportButton } from "@/components/community/CommunityReportButton";
import { CommunityMessagesIcon } from "@/components/community/CommunityMessagesIcon";
import { CommunityProfileBioTopics } from "@/components/community/CommunityProfileBio";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PublicProfile = {
  userId: string;
  fullName: string;
  schoolName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  communityPublic: boolean;
  isOwnProfile: boolean;
  stats: {
    classesCount: number;
    materialsCount: number;
    followersCount: number;
    followingCount: number;
  };
  topComponentes?: string[];
  materials: Array<{
    id: string;
    title: string;
    description: string;
    tipoMaterial: string;
    componente: string;
    etapa: string;
    anoSerie: string;
    downloadsCount: number;
    createdAt: string | null;
  }>;
};

type PublicProfileClientProps = {
  userId: string;
};

export function PublicProfileClient({ userId }: PublicProfileClientProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageUserId, setMessageUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/community/profile/${userId}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        profile?: PublicProfile;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar o perfil.");
      }

      if (!data?.profile) {
        throw new Error("Perfil indisponível.");
      }

      setProfile(data.profile);
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Comunidade"
          icon="market"
          title="Perfil na Comunidade"
          description="Materiais publicados e informações do professor."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <CommunityMessagesIcon
                initialUserId={messageUserId}
                onInitialUserHandled={() => setMessageUserId(null)}
              />
              <Link
                href="/dashboard?secao=marketplace"
                className="pl-hud-btn-secondary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                <PlanifyIcon name="arrowLeft" className="h-3.5 w-3.5" />
                Voltar ao feed
              </Link>
            </div>
          }
        />
      }
    >
      <div className="planify-hud pl-hud-hub mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        {loading ? (
          <section className="pl-hud-glass rounded-2xl p-8 text-center text-sm font-semibold text-slate-500">
            Carregando perfil…
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </section>
        ) : profile ? (
          <>
            <section className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
              <div className="h-24 bg-gradient-to-r from-cyan-100 via-indigo-50 to-violet-100 sm:h-28" />
              <div className="px-5 pb-5 sm:px-6">
                <div className="-mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                  <CommunityAuthorAvatar
                    userId={profile.communityPublic ? profile.userId : null}
                    name={profile.fullName}
                    avatarUrl={profile.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-extrabold text-slate-950">{profile.fullName}</h1>
                    {profile.schoolName ? (
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        🏫 {profile.schoolName}
                      </p>
                    ) : null}
                    {!profile.isOwnProfile && profile.communityPublic ? (
                      <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <CommunityFriendButton
                          targetUserId={profile.userId}
                          isOwnProfile={profile.isOwnProfile}
                          onMessage={(targetId) => setMessageUserId(targetId)}
                        />
                        <CommunityBlockButton
                          targetUserId={profile.userId}
                          isOwnProfile={profile.isOwnProfile}
                        />
                        <CommunityReportButton targetType="user" targetId={profile.userId} />
                      </div>
                    ) : null}
                  </div>
                </div>

                {!profile.communityPublic && !profile.isOwnProfile ? (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Este professor optou por manter o perfil privado.
                  </p>
                ) : profile.bio ? (
                  <CommunityProfileBioTopics className="mt-4" bio={profile.bio} />
                ) : null}

                {profile.topComponentes && profile.topComponentes.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-500">Áreas de atuação:</span>
                    {profile.topComponentes.map((componente) => (
                      <span
                        key={componente}
                        className="rounded-full border border-cyan-400/25 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold text-cyan-800"
                      >
                        {componente}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm font-bold text-slate-700">
                  <span>
                    <strong className="text-slate-950">{profile.stats.materialsCount}</strong>{" "}
                    Materiais
                  </span>
                  <span>
                    <strong className="text-slate-950">{profile.stats.classesCount}</strong> Turmas
                  </span>
                  <span>
                    <strong className="text-slate-950">{profile.stats.followersCount}</strong> Amigos
                  </span>
                </div>
              </div>
            </section>

            {profile.communityPublic || profile.isOwnProfile ? (
              <section className="space-y-3">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
                  Materiais publicados
                </h2>
                {profile.materials.length === 0 ? (
                  <p className="pl-hud-glass rounded-2xl p-6 text-sm font-medium text-slate-500">
                    Nenhum material publicado ainda.
                  </p>
                ) : (
                  profile.materials.map((material) => (
                    <article
                      key={material.id}
                      className="rounded-2xl border border-cyan-400/15 bg-white p-4 shadow-sm"
                    >
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800">
                        {material.tipoMaterial}
                      </span>
                      <h3 className="mt-2 text-lg font-extrabold text-slate-950">{material.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{material.description}</p>
                      <p className="mt-2 text-[11px] font-semibold text-slate-500">
                        {material.componente} · {material.etapa} · {material.anoSerie}
                        {material.downloadsCount > 0
                          ? ` · ${material.downloadsCount} download(s)`
                          : ""}
                      </p>
                      <Link
                        href={`/marketplace/material/${material.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:underline"
                      >
                        <PlanifyIcon name="fileText" className="h-3.5 w-3.5" />
                        Ver material
                      </Link>
                    </article>
                  ))
                )}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </PlanifyWorkspacePane>
  );
}
