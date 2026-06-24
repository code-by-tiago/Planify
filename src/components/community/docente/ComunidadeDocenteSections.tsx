"use client";

import Link from "next/link";
import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";
import {
  formatDocenteNumber,
  formatEventShortTime,
} from "@/lib/community/docente-utils";
import type { DocenteAuthor, DocenteBadgeProgress, DocenteDiscussion, DocenteEvent, DocenteMaterial } from "@/lib/community/docente-types";

type GroupItem = {
  id: string;
  name: string;
  description: string;
  disciplina: string;
  members_count: number;
  joinedByMe?: boolean;
};

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

export function ComunidadeDocenteEventos({
  events,
  isAdmin,
  onCreateEvent,
  onOpenEvent,
}: {
  events: DocenteEvent[];
  isAdmin?: boolean;
  onCreateEvent?: () => void;
  onOpenEvent?: (id: string) => void;
}) {
  if (!events.length) {
    return (
      <EmptyState
        title="Próximos eventos"
        message={
          isAdmin
            ? "Nenhum evento agendado. Crie o primeiro evento da comunidade."
            : "Nenhum evento agendado no momento. Novos eventos serão publicados pela equipe Planify."
        }
        actionLabel={isAdmin ? "Criar evento" : undefined}
        onAction={isAdmin ? onCreateEvent : undefined}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Próximos eventos</h2>
        {isAdmin && onCreateEvent ? (
          <button
            type="button"
            onClick={onCreateEvent}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-600"
          >
            Criar evento
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <article
            key={event.id}
            role={onOpenEvent ? "button" : undefined}
            tabIndex={onOpenEvent ? 0 : undefined}
            onClick={() => onOpenEvent?.(event.id)}
            onKeyDown={(e) => {
              if (onOpenEvent && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onOpenEvent(event.id);
              }
            }}
            className="flex cursor-pointer gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
          >
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <span className="text-xl font-extrabold leading-none">{event.day}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase">{event.month}</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{event.presenterName}</p>
              <p className="mt-2 text-xs font-semibold text-cyan-600">
                {formatEventShortTime(event.startsAt)} · {event.isOnline ? "Online" : "Presencial"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteGrupos({
  groups,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onOpenGroup,
}: {
  groups: GroupItem[];
  onCreateGroup?: () => void;
  onJoinGroup?: (groupId: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onOpenGroup?: (groupId: string) => void;
}) {
  if (!groups.length) {
    return (
      <EmptyState
        title="Grupos de estudo"
        message="Nenhum grupo público disponível. Crie o primeiro grupo da comunidade."
        actionLabel="Criar grupo"
        onAction={onCreateGroup}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Grupos de estudo</h2>
        {onCreateGroup ? (
          <button
            type="button"
            onClick={onCreateGroup}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-600"
          >
            Criar grupo
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <article
            key={group.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
              {group.disciplina}
            </p>
            <h3 className="mt-1 font-bold text-[#0F172A]">
              {onOpenGroup ? (
                <button
                  type="button"
                  onClick={() => onOpenGroup(group.id)}
                  className="text-left hover:text-cyan-700"
                >
                  {group.name}
                </button>
              ) : (
                group.name
              )}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{group.description}</p>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              {formatDocenteNumber(group.members_count)} membros
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {onOpenGroup ? (
                <button
                  type="button"
                  onClick={() => onOpenGroup(group.id)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                >
                  Ver grupo
                </button>
              ) : null}
              {onJoinGroup || onLeaveGroup ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    group.joinedByMe ? onLeaveGroup?.(group.id) : onJoinGroup?.(group.id);
                  }}
                  className={[
                    "w-full rounded-xl py-2 text-xs font-bold transition",
                    group.joinedByMe
                      ? "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      : "bg-[#0F172A] text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  {group.joinedByMe ? "Sair do grupo" : "Entrar no grupo"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteProfessores({
  teachers,
  onFollow,
  onBrowseAll,
}: {
  teachers: DocenteAuthor[];
  onFollow: (id: string) => void;
  onBrowseAll?: () => void;
}) {
  const embedded = useComunidadeEmbedded();

  if (!teachers.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Professores</h2>
        <p className="mt-2 text-sm text-slate-500">
          Nenhum perfil público encontrado. Ative seu perfil público nas configurações da comunidade.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Professores da comunidade</h2>
        {onBrowseAll ? (
          <button
            type="button"
            onClick={onBrowseAll}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            Buscar professores
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {teachers.map((teacher) => (
          <article
            key={teacher.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <CommunityAuthorAvatar
                userId={teacher.id}
                name={teacher.name}
                avatarUrl={teacher.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={communityProfileHref(teacher.id, embedded)}
                  className="font-bold text-[#0F172A] hover:text-cyan-700"
                >
                  {teacher.name}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{teacher.specialty}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {formatDocenteNumber(teacher.materialsCount)} materiais ·{" "}
                  {formatDocenteNumber(teacher.followersCount)} seguidores
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFollow(teacher.id)}
              className={[
                "mt-4 w-full rounded-xl py-2 text-xs font-bold transition",
                teacher.isFollowing
                  ? "border border-slate-200 bg-white text-slate-600"
                  : "bg-[#0F172A] text-white hover:bg-slate-800",
              ].join(" ")}
            >
              {teacher.isFollowing ? "Seguindo" : "Seguir"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function BadgeProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ComunidadeDocenteDesafios({
  badgeProgress,
  onParticipateChallenge,
}: {
  badgeProgress: DocenteBadgeProgress[];
  onParticipateChallenge?: (slug: string) => void;
}) {
  if (!badgeProgress.length) {
    return (
      <EmptyState
        title="Desafios e badges"
        message="Participe da comunidade para desbloquear selos e acompanhar seu progresso."
      />
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Desafios e badges</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {badgeProgress.map((badge) => (
          <article
            key={badge.id}
            className={[
              "rounded-2xl border bg-white p-5 shadow-sm",
              badge.earned ? "border-emerald-200" : "border-slate-200",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="inline-flex rounded-xl px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.name}
              </div>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  badge.earned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {badge.earned ? "Conquistado" : "Em progresso"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{badge.description}</p>
            <div className="mt-4 space-y-3">
              {badge.progress.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{item.label}</span>
                    <span>
                      {formatDocenteNumber(item.current)} / {formatDocenteNumber(item.target)}
                    </span>
                  </div>
                  <BadgeProgressBar current={item.current} target={item.target} />
                </div>
              ))}
            </div>
            {!badge.earned && badge.slug === "desafio-bncc" && onParticipateChallenge ? (
              <button
                type="button"
                onClick={() => onParticipateChallenge(badge.slug)}
                className="mt-4 w-full rounded-xl bg-[#0F172A] py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Participar do desafio BNCC
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteSalvos({
  materials,
  discussions = [],
  embedded = false,
  onLike,
  onSave,
  onSaveDiscussion,
  onOpenDiscussion,
  onDownload,
  downloadingMaterialId,
  onBrowseMaterials,
}: {
  materials: DocenteMaterial[];
  discussions?: DocenteDiscussion[];
  embedded?: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onSaveDiscussion?: (id: string) => void;
  onOpenDiscussion?: (id: string) => void;
  onDownload?: (id: string) => void;
  downloadingMaterialId?: string | null;
  onBrowseMaterials?: () => void;
}) {
  const savedMaterials = materials.filter((m) => m.savedByMe);
  const savedPosts = discussions.filter((d) => d.savedByMe);

  if (!savedMaterials.length && !savedPosts.length) {
    return (
      <EmptyState
        title="Salvos"
        message="Você ainda não salvou discussões nem materiais. Explore a comunidade e salve o que for útil."
        actionLabel="Ver materiais"
        onAction={onBrowseMaterials}
      />
    );
  }

  return (
    <section className="space-y-6">
      {savedPosts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Discussões salvas</h2>
          <ul className="space-y-2">
            {savedPosts.map((discussion) => (
              <li key={discussion.id}>
                <button
                  type="button"
                  onClick={() => onOpenDiscussion?.(discussion.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-cyan-200"
                >
                  <span className="font-semibold text-[#0F172A]">{discussion.title}</span>
                  <span className="text-xs text-slate-400">{discussion.author.name}</span>
                </button>
                {onSaveDiscussion ? (
                  <button
                    type="button"
                    onClick={() => onSaveDiscussion(discussion.id)}
                    className="mt-1 text-xs font-bold text-cyan-600"
                  >
                    Remover
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {savedMaterials.length > 0 ? (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Materiais salvos</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {savedMaterials.map((material) => (
          <ComunidadeDocenteMaterialCard
            key={material.id}
            material={material}
            embedded={embedded}
            onLike={onLike}
            onSave={onSave}
            onDownload={onDownload}
            downloading={downloadingMaterialId === material.id}
          />
        ))}
      </div>
    </div>
      ) : null}
    </section>
  );
}
