"use client";

import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import { useGoogleClassroomExport } from "@/hooks/useGoogleClassroomExport";
import { useEffect, useRef, useState } from "react";

type GoogleClassroomPopoverButtonProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
};

export function GoogleClassroomPopoverButton({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
}: GoogleClassroomPopoverButtonProps) {
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label="Google Classroom"
        title="Enviar ao Google Classroom"
        aria-expanded={open}
      >
        <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-[min(280px,calc(100vw-2rem))] rounded-xl border border-sky-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
            <GoogleClassroomIcon className="h-5 w-5 shrink-0" />
            <p className="text-xs font-black text-sky-900">Google Classroom</p>
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
              Fazer login
            </a>
          ) : !status.connected ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleConnect()}
              className="mt-3 w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white"
            >
              {busy ? "Conectando…" : "Conectar Google"}
            </button>
          ) : (
            <div className="mt-3 space-y-2">
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
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
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
                    const previewWindow = window.open("about:blank", "_blank");
                    void handleExport(previewWindow).then(() => setOpen(false));
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy ? "Enviando…" : "Enviar"}
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
        </div>
      ) : null}
    </div>
  );
}
