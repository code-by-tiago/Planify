"use client";

<<<<<<< HEAD
import { useRef, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";
import { ComunidadeDocenteUserPicker } from "@/components/community/docente/ComunidadeDocenteUserPicker";
import { IconUpload, IconX } from "@/components/community/docente/docente-icons";
import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-utils";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import type { DocenteCreatePostInput, DocenteDisciplina } from "@/lib/community/docente-types";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp";
=======
import { useEffect, useRef, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";
import { ComunidadeDocenteUserPicker } from "@/components/community/docente/ComunidadeDocenteUserPicker";
import { IconFolder, IconGraduation, IconUpload, IconX } from "@/components/community/docente/docente-icons";
import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-utils";
import {
  clearGoogleDrivePickerPending,
  consumeGoogleDrivePickerResumeReady,
  pickFilesFromGoogleDrive,
  readGoogleDrivePickerPending,
} from "@/lib/google/google-drive-picker";
import { peekGoogleOAuthResumeIntent } from "@/lib/google/google-export-resume";
import { GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import type { DocenteCreatePostInput, DocenteDisciplina } from "@/lib/community/docente-types";

export type ComposerIntent = "texto" | "aulas" | "materiais" | "imagem" | "arquivo";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp";
const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
>>>>>>> origin/aplicar-melhorias-na-producao
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

<<<<<<< HEAD
=======
const BODY_MAX = 2000;
const BODY_MIN = 1;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileVisual(file: File): { label: string; tint: string; bg: string } {
  const name = file.name.toLowerCase();
  if (/\.(png|jpe?g|webp)$/.test(name) || file.type.startsWith("image/"))
    return { label: "IMG", tint: "text-emerald-600", bg: "bg-emerald-50" };
  if (/\.pdf$/.test(name)) return { label: "PDF", tint: "text-rose-600", bg: "bg-rose-50" };
  if (/\.pptx?$/.test(name)) return { label: "PPT", tint: "text-orange-600", bg: "bg-orange-50" };
  if (/\.docx?$/.test(name)) return { label: "DOC", tint: "text-cyan-700", bg: "bg-cyan-50" };
  return { label: "FILE", tint: "text-slate-600", bg: "bg-slate-100" };
}

function IconImagePicture({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l5-5 4 4 3.5-3.5L21 16" />
    </svg>
  );
}

function IconPaperclip({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l6.5-6.5a3 3 0 1 1 4.24 4.24l-8.2 8.2a5 5 0 0 1-7.07-7.07l7.5-7.5" />
    </svg>
  );
}

function derivePostTitle(params: {
  explicitTitle?: string;
  body: string;
  fileName?: string | null;
}): string {
  const explicit = params.explicitTitle?.trim() || "";
  if (explicit.length >= 3) {
    return explicit.length > 80 ? `${explicit.slice(0, 77).trimEnd()}…` : explicit;
  }

  const firstLine = params.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine && firstLine.length >= 3) {
    return firstLine.length > 80 ? `${firstLine.slice(0, 77).trimEnd()}…` : firstLine;
  }

  const fromFile = String(params.fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (fromFile.length >= 3) {
    return fromFile.length > 80 ? `${fromFile.slice(0, 77).trimEnd()}…` : fromFile;
  }

  if (firstLine) {
    return `${firstLine} — publicação`.slice(0, 80);
  }

  return "Publicação na comunidade";
}

>>>>>>> origin/aplicar-melhorias-na-producao
type ComunidadeDocenteCreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DocenteCreatePostInput) => void | Promise<void>;
  defaultDisciplina?: DocenteDisciplina;
<<<<<<< HEAD
=======
  intent?: ComposerIntent;
  viewerName?: string;
>>>>>>> origin/aplicar-melhorias-na-producao
};

export function ComunidadeDocenteCreatePostModal({
  open,
  onClose,
  onSubmit,
  defaultDisciplina = "Multidisciplinar",
<<<<<<< HEAD
}: ComunidadeDocenteCreatePostModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
=======
  intent = "texto",
  viewerName = "Professor(a)",
}: ComunidadeDocenteCreatePostModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
>>>>>>> origin/aplicar-melhorias-na-producao
  const [disciplina, setDisciplina] = useState<DocenteDisciplina>(defaultDisciplina);
  const [tagsInput, setTagsInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<CommunityProfileSearchResult[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
<<<<<<< HEAD

  function reset() {
    setTitle("");
    setBody("");
=======
  const [dragActive, setDragActive] = useState(false);
  const [fileAccept, setFileAccept] = useState(ACCEPTED_FILES);
  const [importingDrive, setImportingDrive] = useState(false);

  function reset() {
    setBody("");
    setTitle("");
    setShowAdvanced(false);
>>>>>>> origin/aplicar-melhorias-na-producao
    setDisciplina(defaultDisciplina);
    setTagsInput("");
    setFiles([]);
    setSelectedParticipants([]);
    setError("");
    setSubmitting(false);
<<<<<<< HEAD
=======
    setDragActive(false);
    setFileAccept(ACCEPTED_FILES);
    setImportingDrive(false);
>>>>>>> origin/aplicar-melhorias-na-producao
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

<<<<<<< HEAD
=======
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 50);
    if (intent === "imagem") {
      setFileAccept(IMAGE_ACCEPT);
      window.setTimeout(() => fileInputRef.current?.click(), 120);
    } else if (intent === "arquivo" || intent === "aulas" || intent === "materiais") {
      setFileAccept(ACCEPTED_FILES);
      window.setTimeout(() => fileInputRef.current?.click(), 120);
    } else {
      setFileAccept(ACCEPTED_FILES);
    }
    return () => window.clearTimeout(timer);
  }, [open, intent]);

  // Retoma o Picker do Drive após OAuth (sem exigir novo clique).
  useEffect(() => {
    if (!open || importingDrive || submitting) return;

    const resumeDrivePicker = async () => {
      const pending = readGoogleDrivePickerPending();
      if (!pending) return;

      const oauthIntent = peekGoogleOAuthResumeIntent();
      const resumeReady = consumeGoogleDrivePickerResumeReady();

      if (oauthIntent && !oauthIntent.connected) {
        clearGoogleDrivePickerPending();
        setError(oauthIntent.error || "Não foi possível conectar o Google.");
        return;
      }

      if (!resumeReady && !oauthIntent?.connected) return;

      clearGoogleDrivePickerPending();
      setImportingDrive(true);
      setError("");
      try {
        const remaining = Math.max(0, 5 - files.length);
        if (remaining <= 0) {
          setError("Máximo de 5 anexos por publicação.");
          return;
        }
        const picked = await pickFilesFromGoogleDrive({
          returnTo: pending.returnTo,
          maxFiles: Math.min(remaining, pending.maxFiles || remaining),
          reopenCreatePost: false,
        });
        if (picked.length > 0) {
          setFiles((prev) => [...prev, ...picked].slice(0, 5));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível anexar do Google Drive.",
        );
      } finally {
        setImportingDrive(false);
      }
    };

    const onGoogleStatus = () => {
      void resumeDrivePicker();
    };

    void resumeDrivePicker();
    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, onGoogleStatus);
    return () => {
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, onGoogleStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retoma só ao abrir o modal / status Google
  }, [open]);

>>>>>>> origin/aplicar-melhorias-na-producao
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

<<<<<<< HEAD
=======
  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragActive(false);
    if (submitting) return;
    handleFilesSelected(event.dataTransfer?.files ?? null);
  }

>>>>>>> origin/aplicar-melhorias-na-producao
  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

<<<<<<< HEAD
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Informe um título para a publicação.");
      return;
    }
=======
  async function handlePickFromDrive() {
    if (submitting || importingDrive) return;
    setImportingDrive(true);
    setError("");
    try {
      const remaining = Math.max(0, 5 - files.length);
      if (remaining <= 0) {
        setError("Máximo de 5 anexos por publicação.");
        return;
      }
      const picked = await pickFilesFromGoogleDrive({
        returnTo:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/comunidade",
        maxFiles: remaining,
        reopenCreatePost: true,
      });
      if (picked.length > 0) {
        setFiles((prev) => [...prev, ...picked].slice(0, 5));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível anexar do Google Drive.",
      );
    } finally {
      setImportingDrive(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedBody = body.trim();
    if (trimmedBody.length < BODY_MIN && files.length === 0) {
      setError("Escreva uma mensagem ou anexe um arquivo para publicar.");
      return;
    }

>>>>>>> origin/aplicar-melhorias-na-producao
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

<<<<<<< HEAD
=======
    const resolvedTitle = derivePostTitle({
      explicitTitle: title,
      body: trimmedBody,
      fileName: files[0]?.name || null,
    });

>>>>>>> origin/aplicar-melhorias-na-producao
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
<<<<<<< HEAD
        title: title.trim(),
        body: body.trim(),
=======
        title: resolvedTitle,
        body: trimmedBody,
>>>>>>> origin/aplicar-melhorias-na-producao
        disciplina,
        tags,
        files,
        participantUserIds: selectedParticipants.map((user) => user.userId),
      });
      reset();
      onClose();
<<<<<<< HEAD
    } catch {
      setError("Não foi possível publicar. Tente novamente.");
=======
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível publicar. Tente novamente.",
      );
>>>>>>> origin/aplicar-melhorias-na-producao
      setSubmitting(false);
    }
  }

<<<<<<< HEAD
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
            disabled={submitting}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
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
            disabled={submitting}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
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
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Tags
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="BNCC, atividade, 6º ano"
              disabled={submitting}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
            />
          </div>
        </div>

        <ComunidadeDocenteUserPicker
          label="Convidar participantes (opcional)"
          hint="Professores convidados verão esta discussão no feed."
          selected={selectedParticipants}
          onChange={setSelectedParticipants}
          maxUsers={8}
        />

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
            disabled={submitting}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm font-semibold text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-700 disabled:opacity-60"
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
=======
  const canPublish =
    (body.trim().length >= BODY_MIN || files.length > 0) && !importingDrive;

  return (
    <PlanifyModal
      open={open}
      onClose={handleClose}
      title="Criar publicação"
      description="Escreva uma dúvida, compartilhe uma ideia, informe algo ou anexe um material — como no Facebook."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
          <p className="mb-2 text-xs font-bold text-slate-500">
            {viewerName}, no que você está pensando?
          </p>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
            rows={6}
            placeholder="Tire uma dúvida, compartilhe uma experiência, avise a rede ou escreva o que quiser..."
            disabled={submitting}
            className="w-full resize-none rounded-xl border-0 bg-transparent px-1 py-1 text-[15px] font-medium leading-relaxed text-[#0F172A] outline-none placeholder:text-slate-400 disabled:opacity-60"
          />
          <div className="mt-1 flex justify-end">
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                body.length > BODY_MAX ? "text-rose-500" : "text-slate-300"
              }`}
            >
              {body.length}/{BODY_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-y border-slate-100 py-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setFileAccept(ACCEPTED_FILES);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <IconGraduation className="h-[18px] w-[18px] text-violet-500" />
            Aulas
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setFileAccept(ACCEPTED_FILES);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
          >
            <IconFolder className="h-[18px] w-[18px] text-cyan-500" />
            Materiais
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setFileAccept(IMAGE_ACCEPT);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            <IconImagePicture className="h-[18px] w-[18px] text-emerald-500" />
            Imagem
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setFileAccept(ACCEPTED_FILES);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-amber-50 hover:text-amber-700"
          >
            <IconPaperclip className="h-[18px] w-[18px] text-amber-500" />
            Arquivo
          </button>
          <button
            type="button"
            disabled={submitting || importingDrive}
            onClick={() => void handlePickFromDrive()}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
            title="Anexar arquivo do Google Drive"
          >
            <GoogleDriveIcon className="h-[18px] w-[18px]" />
            {importingDrive ? "Drive…" : "Drive"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={fileAccept}
          multiple
          className="hidden"
          disabled={submitting}
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />

        {files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file, i) => {
              const visual = fileVisual(file);
              return (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${visual.bg} ${visual.tint}`}
                  >
                    {visual.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#0F172A]">{file.name}</p>
                    <p className="text-[11px] font-medium text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
>>>>>>> origin/aplicar-melhorias-na-producao
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={submitting}
<<<<<<< HEAD
                    className="ml-2 shrink-0 text-slate-400 hover:text-red-500 disabled:opacity-60"
=======
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-60"
>>>>>>> origin/aplicar-melhorias-na-producao
                    aria-label="Remover arquivo"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </li>
<<<<<<< HEAD
              ))}
            </ul>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
=======
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!submitting) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            disabled={submitting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-xs font-semibold transition disabled:opacity-60 ${
              dragActive
                ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                : "border-slate-200 bg-white text-slate-400 hover:border-cyan-300 hover:text-cyan-600"
            }`}
          >
            <IconUpload className="h-4 w-4" />
            Arraste anexos ou clique para adicionar (opcional)
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="text-xs font-bold text-slate-500 transition hover:text-cyan-700"
        >
          {showAdvanced ? "Ocultar opções avançadas" : "Opções avançadas (título, disciplina, tags, convidados)"}
        </button>

        {showAdvanced ? (
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Título (opcional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Se vazio, usamos o início da mensagem"
                disabled={submitting}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Disciplina
                </label>
                <select
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value as DocenteDisciplina)}
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                >
                  {DOCENTE_DISCIPLINAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Tags
                </label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="BNCC, dúvida, 6º ano"
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                />
              </div>
            </div>

            <ComunidadeDocenteUserPicker
              label="Convidar participantes (opcional)"
              hint="Professores convidados verão esta publicação no feed."
              selected={selectedParticipants}
              onChange={setSelectedParticipants}
              maxUsers={8}
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">
>>>>>>> origin/aplicar-melhorias-na-producao
            {error}
          </p>
        ) : null}

<<<<<<< HEAD
        <div className="flex gap-3 pt-2">
=======
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
>>>>>>> origin/aplicar-melhorias-na-producao
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
<<<<<<< HEAD
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
=======
            className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
>>>>>>> origin/aplicar-melhorias-na-producao
          >
            Cancelar
          </button>
          <button
            type="submit"
<<<<<<< HEAD
            disabled={submitting}
            className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600 disabled:opacity-60"
=======
            disabled={submitting || !canPublish}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200/60 transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> origin/aplicar-melhorias-na-producao
          >
            {submitting ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </form>
    </PlanifyModal>
  );
}
