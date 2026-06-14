"use client";

import { useEffect, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";

export type DocenteCreateEventInput = {
  title: string;
  description: string;
  presenterName: string;
  startsAt: string;
  isOnline: boolean;
  location: string;
};

type ComunidadeDocenteCreateEventModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DocenteCreateEventInput) => void | Promise<void>;
  mode?: "create" | "edit";
  initialValues?: Partial<DocenteCreateEventInput>;
};

function toDatetimeLocalValue(iso: string): string {
  try {
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
}

export function ComunidadeDocenteCreateEventModal({
  open,
  onClose,
  onSubmit,
  mode = "create",
  initialValues,
}: ComunidadeDocenteCreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [presenterName, setPresenterName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initialValues?.title || "");
    setDescription(initialValues?.description || "");
    setPresenterName(initialValues?.presenterName || "");
    setStartsAt(
      initialValues?.startsAt ? toDatetimeLocalValue(initialValues.startsAt) : "",
    );
    setIsOnline(initialValues?.isOnline !== false);
    setLocation(initialValues?.location || "");
    setError("");
    setSubmitting(false);
  }, [open, initialValues, mode]);

  function reset() {
    setTitle("");
    setDescription("");
    setPresenterName("");
    setStartsAt("");
    setIsOnline(true);
    setLocation("");
    setError("");
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Informe um título com pelo menos 3 caracteres.");
      return;
    }
    if (!startsAt) {
      setError("Informe a data e hora do evento.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        presenterName: presenterName.trim() || "Equipe Planify",
        startsAt: new Date(startsAt).toISOString(),
        isOnline,
        location: location.trim(),
      });
      handleClose();
    } catch {
      setError("Não foi possível criar o evento.");
      setSubmitting(false);
    }
  }

  return (
    <PlanifyModal
      open={open}
      onClose={handleClose}
      title={mode === "edit" ? "Editar evento" : "Criar evento"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Título
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: BNCC na prática"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Descreva o evento..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Apresentador(a)
            </label>
            <input
              value={presenterName}
              onChange={(e) => setPresenterName(e.target.value)}
              placeholder="Nome do apresentador"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={isOnline}
              onChange={(e) => setIsOnline(e.target.checked)}
              className="rounded border-slate-300"
            />
            Evento online
          </label>
        </div>

        {!isOnline ? (
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Local
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Endereço ou sala"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400"
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600 disabled:opacity-60"
          >
            {submitting ? "Salvando…" : mode === "edit" ? "Salvar alterações" : "Publicar evento"}
          </button>
        </div>
      </form>
    </PlanifyModal>
  );
}
