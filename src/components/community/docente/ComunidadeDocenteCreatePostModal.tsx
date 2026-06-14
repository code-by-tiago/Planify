"use client";

import { useRef, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";
import { IconUpload, IconX } from "@/components/community/docente/docente-icons";
import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-mock-data";
import type { DocenteCreatePostInput, DocenteDisciplina } from "@/lib/community/docente-types";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp";
const ACCEPTED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
];

type ComunidadeDocenteCreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DocenteCreatePostInput) => void;
};

export function ComunidadeDocenteCreatePostModal({
  open,
  onClose,
  onSubmit,
}: ComunidadeDocenteCreatePostModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [disciplina, setDisciplina] = useState<DocenteDisciplina>("Ciências");
  const [tagsInput, setTagsInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setBody("");
    setDisciplina("Ciências");
    setTagsInput("");
    setFiles([]);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    const valid = Array.from(selected).filter((f) =>
      ACCEPTED_MIMES.some((m) => f.type === m || f.name.match(/\.(pdf|docx?|pptx?|png|jpe?g|webp)$/i)),
    );
    if (valid.length < selected.length) {
      setError("Alguns arquivos foram ignorados. Use PDF, DOCX, PPTX ou imagens.");
    } else {
      setError("");
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Informe um título para a publicação.");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ title: title.trim(), body: body.trim(), disciplina, tags, files });
    handleClose();
  }

  return (
    <PlanifyModal open={open} onClose={handleClose} title="Criar publicação">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Título
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Sequência didática sobre sustentabilidade"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Conteúdo
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Compartilhe sua experiência, dúvida ou material..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Disciplina
            </label>
            <select
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value as DocenteDisciplina)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400"
            >
              {DOCENTE_DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Tags
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="BNCC, atividade, 6º ano"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Anexos (PDF, DOCX, PPTX, imagens)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm font-semibold text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-700"
          >
            <IconUpload className="h-5 w-5" />
            Arraste ou clique para enviar arquivos
          </button>
          {files.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-2 shrink-0 text-slate-400 hover:text-red-500"
                    aria-label="Remover arquivo"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            {error}
          </p>
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
            className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600"
          >
            Publicar
          </button>
        </div>
      </form>
    </PlanifyModal>
  );
}
