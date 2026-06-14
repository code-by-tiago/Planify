"use client";

import { useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";
import { ComunidadeDocenteUserPicker } from "@/components/community/docente/ComunidadeDocenteUserPicker";
import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-mock-data";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import type { DocenteCreateGroupInput, DocenteDisciplina } from "@/lib/community/docente-types";

type ComunidadeDocenteCreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DocenteCreateGroupInput) => void | Promise<void>;
};

export function ComunidadeDocenteCreateGroupModal({
  open,
  onClose,
  onSubmit,
}: ComunidadeDocenteCreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [disciplina, setDisciplina] = useState<DocenteDisciplina>("Ciências");
  const [selectedMembers, setSelectedMembers] = useState<CommunityProfileSearchResult[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setDisciplina("Ciências");
    setSelectedMembers([]);
    setError("");
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        disciplina,
        memberUserIds: selectedMembers.map((member) => member.userId),
      });
      reset();
      onClose();
    } catch {
      setError("Não foi possível criar o grupo.");
      setSubmitting(false);
    }
  }

  return (
    <PlanifyModal open={open} onClose={handleClose} title="Criar grupo de estudo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Nome do grupo
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Professores de Ciências"
            disabled={submitting}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
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
            placeholder="Descreva o objetivo do grupo..."
            disabled={submitting}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Disciplina
          </label>
          <select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value as DocenteDisciplina)}
            disabled={submitting}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 disabled:opacity-60"
          >
            {DOCENTE_DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <ComunidadeDocenteUserPicker
          label="Convidar professores"
          hint="Professores com perfil público serão adicionados ao grupo automaticamente."
          selected={selectedMembers}
          onChange={setSelectedMembers}
          maxUsers={12}
        />

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600 disabled:opacity-60"
          >
            {submitting ? "Criando…" : "Criar grupo"}
          </button>
        </div>
      </form>
    </PlanifyModal>
  );
}
