"use client";

import { ClassroomGoogleConnectForm } from "@/components/google/ClassroomGoogleConnectForm";
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import {
  classroomGoogleAccountNeedsSwitch,
  needsClassroomGoogleOAuth,
} from "@/lib/google/classroom-google-account";
import {
  buildClassroomExportReviewSummary,
  resolveSelectedCourseLabel,
} from "@/lib/google/classroom-export-client-guard";
import {
  useGoogleClassroomExport,
  type ClassroomExportSuccess,
} from "@/hooks/useGoogleClassroomExport";
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

type PopoverStep = "form" | "review" | "success";

export function GoogleClassroomPopoverButton({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
}: GoogleClassroomPopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PopoverStep>("form");
  const [lastSuccess, setLastSuccess] = useState<ClassroomExportSuccess | null>(null);
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
    canQuickExport,
    loading,
    busy,
    error,
    loginRedirect,
    handleConnect,
    handleSwitchAccount,
    handleDisconnect,
    handleExport,
    handleDriveOnlyExport,
    openClassroomHome,
  } = useGoogleClassroomExport({
    title,
    getHtml,
    onStatus,
    returnTo,
    documentType,
  });

  const needsOAuth = needsClassroomGoogleOAuth(status);
  const needsAccountSwitch = classroomGoogleAccountNeedsSwitch(status);
  const connectMode = needsAccountSwitch ? "switch" : "connect";
  const exportTitle = title.trim() || "Material Planify";
  const courseLabel = resolveSelectedCourseLabel(courses, courseId);
  const reviewSummary = buildClassroomExportReviewSummary({
    title: exportTitle,
    courseLabel,
    asDraft: publishAsDraft,
  });

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPopoverCoords(null);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    const estimatedHeight = step === "review" ? 340 : step === "success" ? 280 : 300;
    let top = rect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 8);
    }

    setPopoverCoords({ top, left, width });
  }, [open, loading, canExport, needsOAuth, needsAccountSwitch, courses.length, step]);

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

  function resetPopoverState() {
    setStep("form");
    setLastSuccess(null);
  }

  function handleClosePopover() {
    setOpen(false);
    resetPopoverState();
  }

  function handleIconClick() {
    if (loading || busy) return;

    if (!status?.configured) {
      setOpen((value) => {
        if (value) resetPopoverState();
        return !value;
      });
      return;
    }

    if (!status.authenticated) {
      window.location.href = `/login?redirect=${loginRedirect}`;
      return;
    }

    if (needsOAuth || needsAccountSwitch) {
      resetPopoverState();
      setOpen(true);
      return;
    }

    setOpen((value) => {
      if (value) {
        resetPopoverState();
        return false;
      }
      resetPopoverState();
      return true;
    });
  }

  async function handleConfirmExport() {
    const result = await handleExport();
    if (!result) return;
    setLastSuccess(result);
    setStep("success");
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
        ) : needsOAuth || needsAccountSwitch ? (
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
        ) : step === "success" && lastSuccess ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-black text-emerald-900">Envio concluído</p>
              <p className="mt-1 text-[11px] leading-5 text-emerald-900">
                {lastSuccess.asDraft
                  ? `Rascunho salvo em "${lastSuccess.courseLabel}". Os alunos só verão depois que você publicar no Classroom.`
                  : `Material publicado em "${lastSuccess.courseLabel}".`}
              </p>
            </div>
            <a
              href={lastSuccess.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-sky-600 px-3 py-2 text-center text-xs font-bold text-white"
            >
              Abrir no Classroom
            </a>
            <button
              type="button"
              onClick={handleClosePopover}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
            >
              Fechar
            </button>
          </div>
        ) : step === "review" && canExport ? (
          <div className="mt-3 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-sky-800">
              Revisar envio
            </p>
            <dl className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-[11px]">
              <div>
                <dt className="font-bold text-sky-900">Material</dt>
                <dd className="font-semibold text-slate-800">{reviewSummary.title}</dd>
              </div>
              <div>
                <dt className="font-bold text-sky-900">Turma</dt>
                <dd className="font-semibold text-slate-800">{reviewSummary.courseLabel}</dd>
              </div>
              <div>
                <dt className="font-bold text-sky-900">Modo</dt>
                <dd className="font-semibold text-slate-800">
                  {reviewSummary.modeLabel} — {reviewSummary.modeDescription}
                </dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("form")}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleConfirmExport()}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {busy ? "Enviando…" : "Confirmar envio"}
              </button>
            </div>
          </div>
        ) : canExport ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold text-sky-900">
              Conectado como{" "}
              <span className="font-bold">{status?.googleEmail || "conta Google"}</span>
            </p>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-sky-900">Turma</span>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="w-full rounded-lg border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
              >
                <option value="">Selecione a turma…</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                    {course.section ? ` — ${course.section}` : ""}
                  </option>
                ))}
              </select>
            </label>

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
              Salvar como rascunho (recomendado — alunos não veem até publicar)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !courseId}
                onClick={() => setStep("review")}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Revisar envio
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
          </div>
        ) : canQuickExport ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] leading-5 text-amber-900">{error}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void handleDriveOnlyExport().then(() => handleClosePopover());
              }}
              className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Salvar no Drive e abrir Classroom"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={openClassroomHome}
              className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-800"
            >
              Abrir classroom.google.com
            </button>
          </div>
        ) : null}

        {error && canExport && step !== "success" ? (
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
        title="Enviar ao Google Classroom — escolha a turma"
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
