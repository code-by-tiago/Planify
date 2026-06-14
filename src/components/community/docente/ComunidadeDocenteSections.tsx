"use client";

import Link from "next/link";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { formatDocenteNumber } from "@/lib/community/docente-mock-data";
import type { DocenteAuthor, DocenteEvent, DocenteMaterial } from "@/lib/community/docente-types";

type GroupItem = {
  id: string;
  name: string;
  description: string;
  disciplina: string;
  members_count: number;
};

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  color: string;
  min_reputation: number;
};

export function ComunidadeDocenteEventos({ events }: { events: DocenteEvent[] }) {
  if (!events.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Próximos eventos</h2>
        <p className="mt-2 text-sm text-slate-500">Nenhum evento agendado no momento.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold text-[#0F172A]">Próximos eventos</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <article
            key={event.id}
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <span className="text-xl font-extrabold leading-none">{event.day}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase">{event.month}</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{event.presenterName}</p>
              <p className="mt-2 text-xs font-semibold text-cyan-600">
                19h00 · {event.isOnline ? "Online" : "Presencial"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteGrupos({ groups }: { groups: GroupItem[] }) {
  if (!groups.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Grupos de estudo</h2>
        <p className="mt-2 text-sm text-slate-500">Nenhum grupo público disponível.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold text-[#0F172A]">Grupos de estudo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <article
            key={group.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
              {group.disciplina}
            </p>
            <h3 className="mt-1 font-bold text-[#0F172A]">{group.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{group.description}</p>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              {formatDocenteNumber(group.members_count)} membros
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteProfessores({
  teachers,
  onFollow,
}: {
  teachers: DocenteAuthor[];
  onFollow: (id: string) => void;
}) {
  if (!teachers.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Professores</h2>
        <p className="mt-2 text-sm text-slate-500">Nenhum perfil público encontrado.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold text-[#0F172A]">Professores da comunidade</h2>
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
                  href={communityProfileHref(teacher.id)}
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

export function ComunidadeDocenteDesafios({ badges }: { badges: BadgeItem[] }) {
  if (!badges.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Desafios e badges</h2>
        <p className="mt-2 text-sm text-slate-500">Desafios em breve.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold text-[#0F172A]">Desafios e badges</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {badges.map((badge) => (
          <article
            key={badge.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className="inline-flex rounded-xl px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: badge.color }}
            >
              {badge.name}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{badge.description}</p>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Reputação mínima: {formatDocenteNumber(badge.min_reputation)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteSalvos({
  materials,
  onLike,
  onSave,
}: {
  materials: DocenteMaterial[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const saved = materials.filter((m) => m.savedByMe);

  if (!saved.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Salvos</h2>
        <p className="mt-2 text-sm text-slate-500">
          Você ainda não salvou materiais. Explore a comunidade e salve o que for útil.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold text-[#0F172A]">Materiais salvos</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {saved.map((material) => (
          <article
            key={material.id}
            className="w-[220px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Link href={`/marketplace/material/${material.id}`} className="block">
              <h3 className="line-clamp-2 text-sm font-bold text-[#0F172A] hover:text-cyan-700">
                {material.title}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-slate-500">{material.author.name}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onLike(material.id)}
                className="text-xs font-bold text-rose-500"
              >
                Curtir
              </button>
              <button
                type="button"
                onClick={() => onSave(material.id)}
                className="text-xs font-bold text-cyan-600"
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
