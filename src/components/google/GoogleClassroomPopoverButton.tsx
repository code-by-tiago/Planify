"use client";

import { ClassroomGoogleConnectForm } from "@/components/google/ClassroomGoogleConnectForm";
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import { needsClassroomGoogleOAuth } from "@/lib/google/classroom-google-account";
import { useGoogleClassroomExport } from "@/hooks/useGoogleClassroomExport";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type GoogleClassroomPopoverButtonProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
};

type PopoverCoords = {
  top: number;
  left: number;
  width: number;
};

export function GoogleClassroomPopoverButton({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
}: GoogleClassroomPopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<PopoverCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    status,
    courses,
    courseId,
    setCourseId,
    description,
    setDescription,
    publishAsDraft,
    setPublishAsDraft,
    institutionalEmail,
    setInstitutionalEmail,
    canExport,
    loading,
    busy,
    error,
    loginRedirect,
    handleConnect,
    handleSwitchAccount,
    handleDisconnect,
    handleExport,
  } = useGoogleClassroomExport({
    title,
    getHtml,
    onStatus,
    returnTo,
    documentType,
  });

  const needsOAuth = needsClassroomGoogleOAuth(status);
  const connectMode = status?.connected && needsOAuth ? "switch" : "connect";

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPopoverCoords(null);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    const estimatedHeight = 300;
    let top = rect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 8);
    }

    setPopoverCoords({ top, left, width });
  }, [open, loading, canExport, needsOAuth, courses.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function handleIconClick() {
    if (loading || busy) return;

    if (!status?.configured) {
      setOpen((value) => !value);
      return;
    }

    if (!status.authenticated) {
      window.location.href = `/login?redirect=${loginRedirect}`;
      return;
    }

    if (needsOAuth) {
      void (status.connected ? handleSwitchAccount() : handleConnect());
      return;
    }

    setOpen((value) => !value);
  }

  const popoverContent =
    open && popoverCoords ? (
      <div
        ref={popoverRef}
        className="rounded-xl border border-sky-200 bg-white p-3 shadow-2xl"
        style={{
          position: "fixed",
          top: popoverCoords.top,
          left: popoverCoords.left,
          width: popoverCoords.width,
          zIndex: 9999,
        }}
      >
        <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
          <GoogleClassroomIcon className="h-5 w-5 shrink-0" />
          <p className="text-xs font-black text-sky-900">Google Classroom</p>
        </div>

        {loading ? (
          <p className="mt-3 text-xs font-semibold text-slate-500">Carregando…</p>
        ) : needsOAuth ? (
          <div className="mt-3">
            <ClassroomGoogleConnectForm
              compact
              institutionalEmail={institutionalEmail}
              onInstitutionalEmailChange={setInstitutionalEmail}
              busy={busy}
              onConnect={() =>
                void (connectMode === "switch" ? handleSwitchAccount() : handleConnect())
              }
              mode={connectMode}
              planifyEmail={status?.planifyEmail}
              connectedGoogleEmail={status?.googleEmail}
            />
          </div>
        ) : canExport ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold text-sky-900">
              Conectado como{" "}
              <span className="font-bold">{status?.googleEmail || "conta Google"}</span>
            </p>

            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                  {course.section ? ` — ${course.section}` : ""}
                </option>
              ))}
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
                disabled={busy || !courseId}
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600"
                title="Desconectar conta Google"
              >
                Desconectar
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSwitchAccount()}
              className="text-[11px] font-semibold text-sky-700 underline-offset-2 hover:underline disabled:opacity-60"
            >
              Trocar conta Google da escola
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] leading-5 text-amber-900">
              Conta conectada, mas nenhuma turma de professor foi encontrada. Troque para a
              conta @educar.rs.gov.br correta ou peça à TI da escola para liberar o Classroom.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSwitchAccount()}
              className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white"
            >
              {busy ? "Abrindo Google…" : "Escolher outra conta Google"}
            </button>
          </div>
        )}

        {error ? (
          <p className="mt-2 text-[11px] font-semibold text-rose-700">{error}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={loading}
        onClick={handleIconClick}
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label="Google Classroom"
        title={
          needsOAuth
            ? "Conectar conta Google da escola para o Classroom"
            : "Enviar ao Google Classroom"
        }
        aria-expanded={open}
      >
        <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
      </button>

      {typeof document !== "undefined" && popoverContent
        ? createPortal(popoverContent, document.body)
        : null}
    </div>
  );
}
