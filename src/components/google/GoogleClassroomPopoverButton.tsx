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
  computeClassroomPopoverCoords,
  estimateClassroomPopoverHeight,
  type ClassroomPopoverCoords,
} from "@/lib/google/classroom-popover-coords";
import {
  CLASSROOM_OPEN_AFTER_OAUTH_KEY,
  useGoogleClassroomExport,
  type ClassroomExportSuccess,
} from "@/hooks/useGoogleClassroomExport";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import { peekGoogleOAuthResumeIntent } from "@/lib/google/google-export-resume";
import { agentDebugLog } from "@/lib/debug/agent-debug-log";
import { GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY =
  "planify:classroom-open-after-oauth-button";

function sanitizeReturnToForButtonId(returnTo?: string) {
  if (!returnTo) return "";
  try {
    const normalized = normalizeGoogleOAuthReturnTo(returnTo);
    const url = new URL(normalized, "http://example.com");
    url.searchParams.delete("google");
    url.searchParams.delete("google_error");
    return `${url.pathname}${url.search}`;
  } catch {
    return returnTo;
  }
}

function resolveClassroomPopoverButtonId(
  title: string,
  returnTo?: string,
  documentType?: string | null,
) {
  return `${CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY}:${title}:${sanitizeReturnToForButtonId(
    returnTo,
  )}:${documentType ?? ""}`;
}

type GoogleClassroomPopoverButtonProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
};

type PopoverStep = "form" | "success";

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
  const [popoverCoords, setPopoverCoords] = useState<ClassroomPopoverCoords | null>(null);
  const buttonId = useMemo(
    () => resolveClassroomPopoverButtonId(title, returnTo, documentType),
    [title, returnTo, documentType],
  );
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
    needsEducarConnect,
    statusReady,
    canShowTurmaList,
    canSubmitExport,
    noTurmasFallback,
    exportReview,
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
    refresh,
  } = useGoogleClassroomExport({
    title,
    getHtml,
    onStatus,
    returnTo,
    documentType,
  });

  const handleConnectWithButtonId = useCallback(async () => {
    try {
      window.sessionStorage.setItem(CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY, buttonId);
    } catch {
      /* ignore */
    }
    await handleConnect();
  }, [buttonId, handleConnect]);

  const handleSwitchAccountWithButtonId = useCallback(async () => {
    try {
      window.sessionStorage.setItem(CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY, buttonId);
    } catch {
      /* ignore */
    }
    await handleSwitchAccount();
  }, [buttonId, handleSwitchAccount]);

  const needsOAuth = needsClassroomGoogleOAuth(status);
  const needsAccountSwitch = classroomGoogleAccountNeedsSwitch(status);
  const connectMode = needsAccountSwitch ? "switch" : "connect";

  const estimatedHeight = estimateClassroomPopoverHeight({
    step,
    needsEducarConnect,
    canShowTurmaList,
  });

  const syncPopoverCoords = useCallback(() => {
    if (!buttonRef.current) return null;
    const coords = computeClassroomPopoverCoords(buttonRef.current, estimatedHeight);
    setPopoverCoords(coords);
    return coords;
  }, [estimatedHeight]);

  const resetPopoverState = useCallback(() => {
    setStep("form");
    setLastSuccess(null);
  }, []);

  const openClassroomPopover = useCallback(() => {
    resetPopoverState();
    syncPopoverCoords();
    setOpen(true);
    void refresh();
  }, [refresh, resetPopoverState, syncPopoverCoords]);

  const handleClosePopover = useCallback(() => {
    setOpen(false);
    setPopoverCoords(null);
    resetPopoverState();
  }, [resetPopoverState]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    syncPopoverCoords();
  }, [
    open,
    syncPopoverCoords,
    loading,
    canShowTurmaList,
    needsEducarConnect,
    noTurmasFallback,
    courses.length,
    step,
    courseId,
  ]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      handleClosePopover();
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, handleClosePopover]);

  useEffect(() => {
    const OPEN_HANDLED_KEY = "planify:classroom-open-after-oauth-handled";
    const OPEN_BUTTON_KEY = "planify:classroom-open-after-oauth-button";

    function maybeOpenAfterOAuth() {
      const hasOAuthIntent = Boolean(peekGoogleOAuthResumeIntent()?.connected);

      try {
        const alreadyHandled = window.sessionStorage.getItem(OPEN_HANDLED_KEY) === "1";
        const openFlag = window.sessionStorage.getItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY);
        const targetButtonId = window.sessionStorage.getItem(OPEN_BUTTON_KEY);

        if (alreadyHandled || openFlag !== "1" || !targetButtonId || targetButtonId !== buttonId) {
          return;
        }

        if (!hasOAuthIntent && openFlag !== "1") {
          return;
        }

        window.sessionStorage.setItem(OPEN_HANDLED_KEY, "1");
        window.sessionStorage.removeItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY);
        window.sessionStorage.removeItem(OPEN_BUTTON_KEY);
        openClassroomPopover();
      } catch {
        /* ignore */
      }
    }

    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, maybeOpenAfterOAuth);
    maybeOpenAfterOAuth();

    return () => {
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, maybeOpenAfterOAuth);
    };
  }, [buttonId, openClassroomPopover]);

  function resolvePopoverBranch():
    | "loading"
    | "not-configured"
    | "not-authenticated"
    | "needs-educar-connect"
    | "success"
    | "turma-list"
    | "no-turmas"
    | "fallback" {
    if (loading) return "loading";
    if (!statusReady) return "fallback";
    if (!status?.configured) return "not-configured";
    if (!status.authenticated) return "not-authenticated";
    if (needsEducarConnect) return "needs-educar-connect";
    if (step === "success" && lastSuccess) return "success";
    if (canShowTurmaList) return "turma-list";
    if (noTurmasFallback) return "no-turmas";
    return "fallback";
  }

  const popoverBranch = resolvePopoverBranch();

  useEffect(() => {
    if (!open) return;

    // #region agent log
    agentDebugLog({
      hypothesisId: "H-D",
      location: "GoogleClassroomPopoverButton.tsx:popoverBranch",
      message: "popover branch",
      data: {
        branch: popoverBranch,
        loading,
        statusReady,
        needsEducarConnect,
        canShowTurmaList,
        noTurmasFallback,
        coursesCount: courses.length,
        hasError: Boolean(error),
        hasCoords: Boolean(popoverCoords),
      },
    });
    // #endregion
  }, [
    open,
    popoverBranch,
    loading,
    statusReady,
    needsEducarConnect,
    canShowTurmaList,
    noTurmasFallback,
    courses.length,
    error,
    popoverCoords,
  ]);

  function handleIconClick() {
    if (busy) return;

    if (open) {
      handleClosePopover();
      return;
    }

    if (statusReady && status && !status.authenticated) {
      openClassroomPopover();
      return;
    }

    openClassroomPopover();

    // #region agent log
    agentDebugLog({
      hypothesisId: "H-A",
      location: "GoogleClassroomPopoverButton.tsx:handleIconClick",
      message: "classroom icon clicked",
      data: {
        loading,
        busy,
        statusReady,
        needsEducarConnect,
        canShowTurmaList,
        coursesCount: courses.length,
      },
    });
    // #endregion
  }

  async function handleConfirmExport() {
    const result = await handleExport();
    if (!result) return;
    setLastSuccess(result);
    setStep("success");
  }

  function renderPopoverBody() {
    if (popoverBranch === "loading") {
      return (
        <div className="mt-3 min-h-[120px] space-y-2">
          <p className="text-xs font-semibold text-slate-500">Carregando integração Google…</p>
          <p className="text-[11px] leading-5 text-slate-400">
            Verificando conta @educar.rs.gov.br e turmas do Classroom.
          </p>
        </div>
      );
    }

    if (popoverBranch === "not-configured") {
      return (
        <div className="mt-3 min-h-[120px] space-y-2">
          <p className="text-[11px] leading-5 text-amber-900">
            Integração Google não configurada no servidor. Peça à TI para configurar{" "}
            <code className="text-[10px]">GOOGLE_CLIENT_ID</code>.
          </p>
        </div>
      );
    }

    if (popoverBranch === "not-authenticated") {
      return (
        <div className="mt-3 min-h-[120px] space-y-2">
          <p className="text-[11px] leading-5 text-slate-700">
            Faça login no Planify para conectar sua conta Google e enviar ao Classroom.
          </p>
          <a
            href={`/login?redirect=${loginRedirect}`}
            className="block w-full rounded-lg bg-sky-600 px-3 py-2 text-center text-xs font-bold text-white"
          >
            Fazer login
          </a>
        </div>
      );
    }

    if (popoverBranch === "needs-educar-connect") {
      return (
        <div className="mt-3 min-h-[120px]">
          <ClassroomGoogleConnectForm
            compact
            institutionalEmail={institutionalEmail}
            onInstitutionalEmailChange={setInstitutionalEmail}
            busy={busy}
            onConnect={() =>
              void (connectMode === "switch"
                ? handleSwitchAccountWithButtonId()
                : handleConnectWithButtonId())
            }
            mode={connectMode}
            planifyEmail={status?.planifyEmail}
            connectedGoogleEmail={status?.googleEmail}
          />
        </div>
      );
    }

    if (popoverBranch === "success" && lastSuccess) {
      return (
        <div className="mt-3 min-h-[120px] space-y-3">
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
      );
    }

    if (popoverBranch === "turma-list") {
      return (
        <div className="mt-3 min-h-[120px] space-y-2">
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

          {canSubmitExport ? (
            <p className="rounded-lg border border-sky-100 bg-sky-50/80 px-2 py-1.5 text-[10px] leading-5 text-sky-900">
              Enviar <strong>{exportReview.title}</strong> para{" "}
              <strong>{exportReview.courseLabel}</strong> como{" "}
              <strong>{exportReview.modeLabel}</strong>.
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !canSubmitExport}
              onClick={() => void handleConfirmExport()}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "Enviando…" : "Enviar à turma"}
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
      );
    }

    if (popoverBranch === "no-turmas") {
      return (
        <div className="mt-3 min-h-[120px] space-y-2">
          <p className="text-[11px] leading-5 text-amber-900">
            {error ||
              "Nenhuma turma de professor encontrada nesta conta. Salve no Drive e anexe manualmente no Classroom."}
          </p>
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
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSwitchAccountWithButtonId()}
            className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900"
          >
            Trocar conta Google
          </button>
        </div>
      );
    }

    return (
      <div className="mt-3 min-h-[120px] space-y-2">
        <p className="text-[11px] leading-5 text-rose-800">
          {error || "Não foi possível carregar o Google Classroom."}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-800"
        >
          Tentar novamente
        </button>
        {needsOAuth ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConnect()}
            className="w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Conectar conta @educar.rs.gov.br
          </button>
        ) : null}
      </div>
    );
  }

  const effectiveCoords =
    open && buttonRef.current
      ? popoverCoords ?? computeClassroomPopoverCoords(buttonRef.current, estimatedHeight)
      : null;

  const popoverContent =
    open && effectiveCoords ? (
      <div
        ref={popoverRef}
        className="max-h-[min(70dvh,420px)] overflow-y-auto rounded-xl border border-sky-200 bg-white p-3 shadow-2xl"
        style={{
          position: "fixed",
          top: effectiveCoords.top,
          left: effectiveCoords.left,
          width: effectiveCoords.width,
          zIndex: 99999,
        }}
      >
        <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
          <GoogleClassroomIcon className="h-5 w-5 shrink-0" />
          <p className="text-xs font-black text-sky-900">Google Classroom</p>
        </div>

        {renderPopoverBody()}

        {error && canShowTurmaList && step !== "success" ? (
          <p className="mt-2 text-[11px] font-semibold text-rose-700">{error}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={busy}
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
