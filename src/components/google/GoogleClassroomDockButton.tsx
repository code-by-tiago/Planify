"use client";

import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { useGoogleClassroomExport } from "@/hooks/useGoogleClassroomExport";
import { useEffect, useRef, useState } from "react";

type GoogleClassroomDockButtonProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
  disabled?: boolean;
  className?: string;
};

export function GoogleClassroomDockButton({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
  disabled = false,
  className = "",
}: GoogleClassroomDockButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const {
    status,
    courses,
    courseId,
    setCourseId,
    description,
    setDescription,
    publishAsDraft,
    setPublishAsDraft,
    loading,
    busy,
    error,
    loginRedirect,
    handleConnect,
    handleDisconnect,
    handleExport,
  } = useGoogleClassroomExport({
    title,
    getHtml,
    onStatus,
    returnTo,
    documentType,
  });

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const buttonDisabled = disabled || loading;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={buttonDisabled}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={open}
        title="Publicar material na turma do Google Classroom"
      >
        <GoogleClassroomIcon className="h-4 w-4 shrink-0 brightness-0 invert" />
        {loading ? "Classroom…" : "Publicar na turma"}
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-sky-200 bg-white p-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
            <GoogleClassroomIcon className="h-5 w-5 shrink-0" />
            <p className="text-sm font-black text-sky-900">Google Classroom</p>
          </div>

          {loading ? (
            <p className="mt-3 text-xs font-semibold text-slate-500">Carregando…</p>
          ) : !status?.configured ? (
            <p className="mt-3 text-xs leading-5 text-amber-900">
              Integração Google não configurada no servidor.
            </p>
          ) : !status.authenticated ? (
            <a
              href={`/login?redirect=${loginRedirect}`}
              className="mt-3 inline-block rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
            >
              Fazer login para publicar
            </a>
          ) : !status.connected ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleConnect()}
              className="mt-3 w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white"
            >
              {busy ? "Conectando…" : "Conectar Google Classroom"}
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-semibold text-sky-800">
                Conectado como {status.googleEmail || "conta Google"}
              </p>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
              >
                {courses.length === 0 ? (
                  <option value="">Sem turmas como professor</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                      {course.section ? ` — ${course.section}` : ""}
                    </option>
                  ))
                )}
              </select>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="Instruções para a turma (opcional)"
                className="w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs font-medium text-slate-900"
              />
              <label className="flex items-center gap-2 text-[11px] font-semibold text-sky-900">
                <input
                  type="checkbox"
                  checked={publishAsDraft}
                  onChange={(event) => setPublishAsDraft(event.target.checked)}
                />
                Salvar como rascunho
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || !courseId || courses.length === 0}
                  onClick={() => {
                    void handleExport().then(() => setOpen(false));
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy ? "Publicando…" : "Publicar na turma"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDisconnect()}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600"
                  title="Desconectar"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {error ? (
            <p className="mt-2 text-[11px] font-semibold text-rose-700">{error}</p>
          ) : null}

          <p className="mt-3 text-[10px] leading-4 text-sky-800/90">
            Você publica na sua turma do Classroom — os alunos acessam pelo Google,
            não pelo Planify.
          </p>
        </div>
      ) : null}
    </div>
  );
}
