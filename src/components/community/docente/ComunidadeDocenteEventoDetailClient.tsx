"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import type { CommunityEventDetail } from "@/server/community/community-docente-service";
import { comunidadeRoutes } from "@/lib/community/docente-utils";

export function ComunidadeDocenteEventoDetailClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<CommunityEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/community/docente/evento/${eventId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Evento não encontrado.");
      }
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        activeMenu="eventos"
        breadcrumbs={[{ label: "Eventos", href: comunidadeRoutes.home }]}
        title="Carregando…"
      >
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  if (error || !event) {
    return (
      <ComunidadeDocenteDetailShell
        activeMenu="eventos"
        breadcrumbs={[{ label: "Eventos", href: comunidadeRoutes.home }]}
        title="Evento"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error || "Evento não encontrado."}</p>
          <button
            type="button"
            onClick={() => router.push(comunidadeRoutes.home)}
            className="mt-3 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Voltar à comunidade
          </button>
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  return (
    <ComunidadeDocenteDetailShell
      activeMenu="eventos"
      breadcrumbs={[{ label: "Eventos", href: comunidadeRoutes.home }]}
      title={event.title}
      subtitle={event.presenterName}
    >
      <div className="flex gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <span className="text-3xl font-extrabold leading-none">{event.day}</span>
          <span className="mt-1 text-xs font-bold uppercase">{event.month}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold capitalize text-[#0F172A]">{event.dateLabel}</p>
          <p className="mt-1 text-lg font-extrabold text-cyan-600">
            {event.timeLabel} · {event.isOnline ? "Online" : "Presencial"}
          </p>
          {!event.isOnline && event.location ? (
            <p className="mt-2 text-sm text-slate-500">{event.location}</p>
          ) : null}
          {event.host ? (
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Organizado por{" "}
              <Link
                href={comunidadeRoutes.professor(event.host.id)}
                className="text-cyan-700 hover:underline"
              >
                {event.host.name}
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Sobre o evento</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {event.description || "Detalhes em breve."}
        </p>
      </section>
    </ComunidadeDocenteDetailShell>
  );
}
