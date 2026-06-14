"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import Link from "next/link";
import type { DocenteAuthor, DocenteEvent, DocenteMenuItem, DocenteRecentPublication } from "@/lib/community/docente-types";
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
            {recentPublications.map((pub) => (
              <li key={pub.id}>
                <Link
                  href={pub.href || `/marketplace/material/${pub.id}`}
                  className="flex w-full items-start gap-3 rounded-xl p-1 text-left transition hover:bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pub.thumbnailUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
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
            ))}
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
                    href={communityProfileHref(teacher.id)}
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
                  </span>
                ))}
              </div>
            ) : null}

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
        )}
      </section>
    </aside>
  );
}
