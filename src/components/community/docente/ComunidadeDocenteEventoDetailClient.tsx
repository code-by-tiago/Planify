"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ComunidadeDocenteCreateEventModal } from "@/components/community/docente/ComunidadeDocenteCreateEventModal";
import type { DocenteCreateEventInput } from "@/components/community/docente/ComunidadeDocenteCreateEventModal";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import type { CommunityEventDetail } from "@/server/community/community-docente-service";
import {
  comunidadeRoutes,
  formatDocenteNumber,
  homeWithAba,
  isComunidadeEmbedded,
} from "@/lib/community/docente-utils";

export function ComunidadeDocenteEventoDetailClient({
  eventId,
  forceEmbedded,
}: {
  eventId: string;
  forceEmbedded?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedded = isComunidadeEmbedded(searchParams, forceEmbedded);

  const [event, setEvent] = useState<CommunityEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const eventosHref = homeWithAba("eventos", embedded);

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

  const showToast = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3000);
  };

  const handleRsvp = async (nextStatus: "going" | "interested" | "none") => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "event_rsvp", eventId, status: nextStatus }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                userRsvpStatus: data.status,
                goingCount: data.goingCount,
                interestedCount: data.interestedCount,
              }
            : prev,
        );
        showToast(
          data.status === "going"
            ? "Presença confirmada!"
            : data.status === "interested"
              ? "Interesse registrado!"
              : "Participação removida.",
        );
      } else {
        showToast(data?.error?.message || "Não foi possível registrar.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEvent = async (input: DocenteCreateEventInput) => {
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_event",
        eventId,
        ...input,
      }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      showToast("Evento atualizado!");
      setEditOpen(false);
      await load();
    } else {
      showToast(data?.error?.message || "Não foi possível atualizar.");
      throw new Error("update failed");
    }
  };

  const handleDeleteEvent = async () => {
    if (!event || !window.confirm(`Excluir o evento "${event.title}"?`)) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_event", eventId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Evento excluído.");
        router.push(eventosHref);
      } else {
        showToast(data?.error?.message || "Não foi possível excluir.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="eventos"
        breadcrumbs={[{ label: "Eventos", href: eventosHref }]}
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
        embedded={embedded}
        activeMenu="eventos"
        breadcrumbs={[{ label: "Eventos", href: eventosHref }]}
        title="Evento"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error || "Evento não encontrado."}</p>
          <button
            type="button"
            onClick={() => router.push(eventosHref)}
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
      embedded={embedded}
      activeMenu="eventos"
      breadcrumbs={[{ label: "Eventos", href: eventosHref }]}
      title={event.title}
      subtitle={event.presenterName}
      actions={
        <div className="flex flex-wrap gap-2">
          {event.isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-200"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDeleteEvent()}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                Excluir
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              void handleRsvp(event.userRsvpStatus === "going" ? "none" : "going")
            }
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition",
              event.userRsvpStatus === "going"
                ? "bg-emerald-600 text-white"
                : "bg-[#0F172A] text-white hover:bg-slate-800",
            ].join(" ")}
          >
            {event.userRsvpStatus === "going" ? "Presença confirmada" : "Confirmar presença"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              void handleRsvp(event.userRsvpStatus === "interested" ? "none" : "interested")
            }
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition",
              event.userRsvpStatus === "interested"
                ? "border border-amber-300 bg-amber-50 text-amber-800"
                : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200",
            ].join(" ")}
          >
            {event.userRsvpStatus === "interested" ? "Interessado(a)" : "Tenho interesse"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:gap-6">
        <div className="mx-auto flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 sm:mx-0 sm:h-24 sm:w-24">
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
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {formatDocenteNumber(event.goingCount)} confirmados ·{" "}
            {formatDocenteNumber(event.interestedCount)} interessados
          </p>
          {event.host ? (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Organizado por{" "}
              <Link
                href={comunidadeRoutes.professor(event.host.id, embedded)}
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

      {event.participantsGoing.length > 0 || event.participantsInterested.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0F172A]">
              Confirmados ({formatDocenteNumber(event.goingCount)})
            </h3>
            <ul className="mt-3 space-y-2">
              {event.participantsGoing.map((p) => (
                <li key={p.id}>
                  <Link
                    href={comunidadeRoutes.professor(p.id, embedded)}
                    className="text-sm font-semibold text-cyan-700 hover:underline"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0F172A]">
              Interessados ({formatDocenteNumber(event.interestedCount)})
            </h3>
            <ul className="mt-3 space-y-2">
              {event.participantsInterested.map((p) => (
                <li key={p.id}>
                  <Link
                    href={comunidadeRoutes.professor(p.id, embedded)}
                    className="text-sm font-semibold text-cyan-700 hover:underline"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {status ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-xl">
          {status}
        </div>
      ) : null}

      <ComunidadeDocenteCreateEventModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdateEvent}
        mode="edit"
        initialValues={{
          title: event.title,
          description: event.description,
          presenterName: event.presenterName,
          startsAt: event.startsAt,
          isOnline: event.isOnline,
          location: event.location || "",
        }}
      />
    </ComunidadeDocenteDetailShell>
  );
}
