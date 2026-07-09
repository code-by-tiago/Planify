"use client";

import Link from "next/link";
import { useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { CommunityProfileBioTopics } from "@/components/community/CommunityProfileBio";
import {
  comunidadeRoutes,
  formatDocenteNumber,
  formatDocenteTimeAgo,
} from "@/lib/community/docente-utils";
import type { CommunityTeacherDetail } from "@/server/community/community-docente-service";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

const DEFAULT_COVER =
  "radial-gradient(circle at 18% 40%, rgba(167,139,250,0.45) 0, transparent 42%), radial-gradient(circle at 82% 30%, rgba(96,165,250,0.35) 0, transparent 40%), linear-gradient(135deg, #ede9fe 0%, #e0e7ff 45%, #fce7f3 100%)";

type CommunityPublicProfileProps = {
  teacher: CommunityTeacherDetail;
  embedded?: boolean;
  onFollow: () => void;
  onMessage: () => void;
  messaging?: boolean;
};

export function CommunityPublicProfile({
  teacher,
  embedded = false,
  onFollow,
  onMessage,
  messaging = false,
}: CommunityPublicProfileProps) {
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const { profile } = teacher;
  const stats = teacher.stats || {
    classesCount: 0,
    materialsCount: profile.materialsCount,
    followersCount: profile.followersCount,
    followingCount: 0,
  };

  const filteredPortfolio = portfolioQuery.trim()
    ? teacher.materials.filter((m) =>
        m.title.toLowerCase().includes(portfolioQuery.trim().toLowerCase()),
      )
    : teacher.materials;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        <div className="relative h-36 sm:h-44">
          {teacher.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacher.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: DEFAULT_COVER }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute right-3 top-3 flex flex-wrap gap-2 sm:right-4 sm:top-4">
            <button
              type="button"
              onClick={onFollow}
              className={[
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-sm transition",
                teacher.isFollowing
                  ? "border border-white/80 bg-white/95 text-slate-700 hover:bg-white"
                  : "bg-[#2563EB] text-white hover:bg-blue-700",
              ].join(" ")}
            >
              <PlanifyIcon
                name={teacher.isFollowing ? "checkCircle" : "user"}
                className="h-3.5 w-3.5"
              />
              {teacher.isFollowing ? "Seguindo" : "Seguir"}
            </button>
            <button
              type="button"
              disabled={messaging}
              onClick={onMessage}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
            >
              <PlanifyIcon name="message" className="h-3.5 w-3.5" />
              {messaging ? "Abrindo…" : "Mensagem"}
            </button>
          </div>
        </div>

        <div className="relative px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg sm:mx-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
                  {initialsFromName(profile.name)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:pt-2 sm:text-left">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
                {profile.name}
              </h2>
              {teacher.schoolName ? (
                <p className="mt-2 text-sm font-semibold text-slate-600">{teacher.schoolName}</p>
              ) : null}
              {teacher.topComponentes.length > 0 ? (
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {teacher.topComponentes.map((componente) => (
                    <span
                      key={componente}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600"
                    >
                      {componente}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <CommunityProfileBioTopics
            className="mt-4"
            bio={teacher.bio}
            emptyMessage=""
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
            <span>
              <strong className="text-slate-950">{formatDocenteNumber(stats.classesCount)}</strong>{" "}
              Aulas
            </span>
            <span>
              <strong className="text-slate-950">{formatDocenteNumber(stats.materialsCount)}</strong>{" "}
              Materiais
            </span>
            <span>
              <strong className="text-slate-950">{formatDocenteNumber(stats.followersCount)}</strong>{" "}
              Seguidores
            </span>
            <span>
              <strong className="text-slate-950">{formatDocenteNumber(stats.followingCount)}</strong>{" "}
              Seguindo
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/70 bg-white p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
            <PlanifyIcon name="shieldCheck" className="h-4 w-4 text-amber-500" />
            Conquistas
          </h3>
          {teacher.badges.length > 0 ? (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {teacher.badges.map((badge) => (
                <div key={badge.slug} title={badge.name} className="flex flex-col items-center gap-1">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ backgroundColor: badge.color }}
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
              Ainda não conquistou selos na comunidade.
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
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
          <PlanifyIcon name="fileText" className="h-4 w-4 text-[#2563EB]" />
          Publicações recentes
        </h3>
        {teacher.discussions.length === 0 ? (
          <p className="mt-4 text-sm font-medium text-slate-500">Nenhuma publicação ainda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {teacher.discussions.slice(0, 6).map((post) => (
              <li key={post.id}>
                <Link
                  href={comunidadeRoutes.discussao(post.id, embedded)}
                  className="block rounded-xl px-3 py-2 transition hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-700">{post.title}</p>
                  <p className="text-[11px] font-medium text-slate-400">
                    {formatDocenteTimeAgo(post.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
          <PlanifyIcon name="folder" className="h-4 w-4 text-[#2563EB]" />
          Portfólio
        </h3>
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
            {teacher.materials.length === 0
              ? "Nenhum material publicado ainda."
              : "Nenhum material encontrado para essa busca."}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredPortfolio.map((material) => (
              <Link
                key={material.id}
                href={comunidadeRoutes.material(material.id, embedded)}
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
    </div>
  );
}
