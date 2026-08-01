"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
<<<<<<< HEAD
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";
import Link from "next/link";
import type { DocenteAuthor, DocenteEvent, DocenteMenuItem, DocenteRecentPublication } from "@/lib/community/docente-types";
import { resolveMaterialCoverVisual } from "@/lib/materials/material-cover-visual";
import {
  formatDocenteNumber,
  formatDocenteTimeAgo,
  formatEventShortTime,
  comunidadeRoutes,
} from "@/lib/community/docente-utils";

type ComunidadeDocenteRightSidebarProps = {
  featuredTeacher: DocenteAuthor | null;
  recentPublications: DocenteRecentPublication[];
  events: DocenteEvent[];
  onFollow: (authorId: string) => void;
  onSelectMenu?: (menu: DocenteMenuItem) => void;
  onCreatePost?: () => void;
  onOpenEvent?: (id: string) => void;
};

export function ComunidadeDocenteRightSidebar({
  featuredTeacher: teacher,
  recentPublications,
  events,
  onFollow,
  onSelectMenu,
  onCreatePost,
  onOpenEvent,
}: ComunidadeDocenteRightSidebarProps) {
  const embedded = useComunidadeEmbedded();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[300px]">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Publicações recentes</h2>
        {recentPublications.length === 0 ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">
              Nenhuma publicação ainda. Seja o primeiro a compartilhar!
            </p>
            {onCreatePost ? (
              <button
                type="button"
                onClick={onCreatePost}
                className="mt-3 w-full rounded-xl bg-cyan-500 py-2 text-xs font-bold text-white transition hover:bg-cyan-600"
              >
                Criar publicação
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentPublications.map((pub) => {
              const visual = resolveMaterialCoverVisual(pub.tipoMaterial || pub.title);
              return (
              <li key={pub.id}>
                <Link
                  href={pub.href || `/marketplace/material/${pub.id}`}
                  className="flex w-full items-start gap-3 rounded-xl p-1 text-left transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${visual.accent} text-white shadow-sm`}
                  >
                    <PlanifyIcon name={visual.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-[#0F172A]">
                      {pub.title}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      {pub.authorName} · {formatDocenteTimeAgo(pub.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Próximos eventos</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Nenhum evento agendado. Confira a aba Eventos em breve.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() =>
                    onOpenEvent ? onOpenEvent(event.id) : onSelectMenu?.("eventos")
                  }
                  className="flex w-full gap-3 rounded-xl p-1 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <span className="text-lg font-extrabold leading-none">{event.day}</span>
                    <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">
                      {event.month}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-[#0F172A]">
                      {event.title}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {event.presenterName}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-cyan-600">
                      {formatEventShortTime(event.startsAt)} ·{" "}
                      {event.isOnline ? "Online" : "Presencial"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Professores em destaque</h2>
        {!teacher ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Explore a aba Professores para conhecer a comunidade.
          </p>
        ) : (
          <div className="mt-4 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/50 to-white p-4">
            <div className="flex items-start gap-3">
              <CommunityAuthorAvatar
                userId={teacher.id}
                name={teacher.name}
                avatarUrl={teacher.avatarUrl}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={communityProfileHref(teacher.id, embedded)}
                    className="text-sm font-bold text-[#0F172A] hover:text-cyan-700"
                  >
                    {teacher.name}
                  </Link>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Em destaque
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">{teacher.specialty}</p>
              </div>
            </div>

            {teacher.badges.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {teacher.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-cyan-700 shadow-sm"
                  >
                    {badge}
=======
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";
import Link from "next/link";
import type { DocenteAuthor } from "@/lib/community/docente-types";

type ViewerProfileSummary = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl?: string | null;
  topComponentes: string[];
  schoolName: string | null;
  roleLabel?: string | null;
  gradeLabel?: string | null;
};

type ComunidadeDocenteRightSidebarProps = {
  suggestedTeachers?: DocenteAuthor[];
  viewerProfile?: ViewerProfileSummary | null;
  onFollow: (authorId: string) => void;
  onOpenProfile?: () => void;
};

export function ComunidadeDocenteRightSidebar({
  suggestedTeachers = [],
  viewerProfile,
  onFollow,
  onOpenProfile,
}: ComunidadeDocenteRightSidebarProps) {
  const embedded = useComunidadeEmbedded();
  const specialty =
    viewerProfile?.topComponentes?.[0] ||
    viewerProfile?.roleLabel ||
    "Professor(a)";
  const grade = viewerProfile?.gradeLabel || viewerProfile?.schoolName || null;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[300px]">
      {viewerProfile ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative h-[88px] bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50">
            {viewerProfile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewerProfile.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
            {onOpenProfile ? (
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label="Editar perfil"
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="relative px-5 pb-5 pt-0">
            <div className="-mt-8 mb-3">
              <CommunityAuthorAvatar
                userId={viewerProfile.userId}
                name={viewerProfile.displayName}
                avatarUrl={viewerProfile.avatarUrl}
                linkable={false}
                size="md"
              />
            </div>
            <p className="truncate text-sm font-extrabold text-[#0F172A]">
              {viewerProfile.displayName}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
              {[specialty, grade].filter(Boolean).join(" · ")}
            </p>

            {viewerProfile.topComponentes.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {viewerProfile.topComponentes.slice(0, 3).map((comp) => (
                  <span
                    key={comp}
                    className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold text-cyan-700"
                  >
                    {comp}
>>>>>>> origin/aplicar-melhorias-na-producao
                  </span>
                ))}
              </div>
            ) : null}

<<<<<<< HEAD
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(teacher.materialsCount)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">materiais</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(teacher.followersCount)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">seguidores</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#0F172A]">
                  {formatDocenteNumber(teacher.reputation)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">reputação</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onFollow(teacher.id)}
              className={[
                "mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition",
                teacher.isFollowing
                  ? "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  : "bg-[#0F172A] text-white hover:bg-slate-800",
              ].join(" ")}
            >
              {teacher.isFollowing ? "Seguindo" : "Seguir professor"}
            </button>
          </div>
=======
            {onOpenProfile ? (
              <button
                type="button"
                onClick={onOpenProfile}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="3.5" />
                </svg>
                Meu perfil
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Professores como você</h2>
        {suggestedTeachers.length === 0 ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Em breve sugeriremos professores com perfil parecido com o seu.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {suggestedTeachers.map((author) => (
              <li key={author.id} className="flex items-start gap-3">
                <CommunityAuthorAvatar
                  userId={author.id}
                  name={author.name}
                  avatarUrl={author.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={communityProfileHref(author.id, embedded)}
                    className="block truncate text-xs font-bold text-[#0F172A] hover:text-cyan-700"
                  >
                    {author.name}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-400">
                    {author.specialty}
                  </p>
                  <button
                    type="button"
                    onClick={() => onFollow(author.id)}
                    className={[
                      "mt-2 rounded-lg px-3 py-1 text-[11px] font-bold transition",
                      author.isFollowing
                        ? "border border-slate-200 bg-white text-slate-500"
                        : "bg-[#0F172A] text-white hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {author.isFollowing ? "Seguindo" : "Seguir"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
>>>>>>> origin/aplicar-melhorias-na-producao
        )}
      </section>
    </aside>
  );
}
