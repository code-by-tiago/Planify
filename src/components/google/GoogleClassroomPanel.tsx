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
import { useGoogleClassroomExport } from "@/hooks/useGoogleClassroomExport";

type GoogleClassroomPanelProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  compact?: boolean;
  returnTo?: string;
  documentType?: string | null;
};

export function GoogleClassroomPanel({
  title,
  getHtml,
  onStatus,
  compact = false,
  returnTo,
  documentType,
}: GoogleClassroomPanelProps) {
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
    needsClassroomAuthorization,
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

  const btnPrimary = compact
    ? GOOGLE_ICON_ONLY_BUTTON_CLASS
    : "inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-60";

  const btnSuccess = compact
    ? GOOGLE_ICON_ONLY_BUTTON_CLASS
    : "rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60";

  const needsOAuth = needsClassroomGoogleOAuth(status);
  const needsAccountSwitch = classroomGoogleAccountNeedsSwitch(status);
  const connectMode = needsAccountSwitch ? "switch" : "connect";

  function handleCompactIconClick() {
    if (busy) return;

    if (needsEducarConnect) {
      void (needsAccountSwitch ? handleSwitchAccount() : handleConnect());
      return;
    }

    if (canShowTurmaList) {
      onStatus?.("Escolha a turma no painel e clique em Enviar à turma.");
      return;
    }

    if (noTurmasFallback) {
      void handleDriveOnlyExport();
    }
  }

  if (loading) {
    return compact ? (
      <button
        type="button"
        disabled
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label="Google Classroom"
        title="Google Classroom"
      >
        <span className="opacity-50">
          <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
        </span>
      </button>
    ) : (
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-900">
        Verificando integração Google...
      </div>
    );
  }

  if (!status?.configured) {
    return compact ? (
      <button
        type="button"
        disabled
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label="Classroom (config)"
        title="Configure GOOGLE_CLIENT_ID no servidor"
      >
        <span className="opacity-50">
          <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
        </span>
      </button>
    ) : (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p className="font-black">Google Classroom — configuração pendente</p>
        <p className="mt-2">
          O servidor ainda não tem <code className="text-xs">GOOGLE_CLIENT_ID</code> e{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code>. Siga o guia{" "}
          <strong>docs/google/CONFIGURAR-GOOGLE-CLOUD.md</strong> e reinicie o{" "}
          <code className="text-xs">npm run dev</code>.
        </p>
      </div>
    );
  }

  if (!status.authenticated) {
    return compact ? (
      <a
        href={`/login?redirect=${loginRedirect}`}
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label="Classroom"
        title="Fazer login para Google Classroom"
      >
        <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
      </a>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-black text-slate-900">Enviar ao Google Classroom</p>
        <p className="mt-2">
          Faça login no Planify para conectar sua conta Google e publicar materiais na turma.
        </p>
        <a
          href={`/login?redirect=${loginRedirect}`}
          className="mt-3 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
        >
          Ir para login
        </a>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleCompactIconClick}
          className={btnPrimary}
          aria-label={busy ? "Enviando…" : "Enviar ao Google Classroom"}
          title={
            needsEducarConnect
              ? "Conectar conta Google da escola"
              : "Enviar ao Google Classroom"
          }
        >
          <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
        </button>
        {error ? (
          <span
            className="max-w-[200px] truncate text-[11px] font-semibold text-rose-700"
            title={error}
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5">
      <div className="flex items-center gap-2">
        <GoogleClassroomIcon className="h-6 w-6 shrink-0" />
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">
          Google Classroom
        </p>
      </div>

      {canShowTurmaList ? (
        <p className="mt-2 text-sm text-sky-900">
          Conectado como <strong>{status.googleEmail || "conta Google"}</strong>
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-sky-900">
          Use a conta Google institucional (@educar.rs.gov.br) para publicar na turma. O
          login do Planify pode ser outro e-mail.
        </p>
      )}

      {error ? (
        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${
            noTurmasFallback && !needsEducarConnect
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {needsEducarConnect ? (
          <ClassroomGoogleConnectForm
            institutionalEmail={institutionalEmail}
            onInstitutionalEmailChange={setInstitutionalEmail}
            busy={busy}
            onConnect={() =>
              void (connectMode === "switch" ? handleSwitchAccount() : handleConnect())
            }
            mode={connectMode}
            planifyEmail={status.planifyEmail}
            connectedGoogleEmail={status.googleEmail}
            authorizationMissing={needsClassroomAuthorization}
          />
        ) : canShowTurmaList ? (
          <>
            <label className="grid w-full min-w-[200px] flex-1 gap-1">
              <span className="text-xs font-bold text-sky-800">Turma</span>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
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

            <label className="grid w-full min-w-[200px] flex-1 gap-1">
              <span className="text-xs font-bold text-sky-800">Descrição</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="Instruções para a turma (opcional)"
                className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
              />
            </label>

            <label className="flex w-full items-center gap-2 text-sm font-semibold text-sky-900">
              <input
                type="checkbox"
                checked={publishAsDraft}
                onChange={(event) => setPublishAsDraft(event.target.checked)}
              />
              Publicar como rascunho (visível só para você até publicar no Classroom)
            </label>

            {canSubmitExport ? (
              <p className="w-full rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs leading-5 text-sky-900">
                Enviar <strong>{exportReview.title}</strong> para{" "}
                <strong>{exportReview.courseLabel}</strong> como{" "}
                <strong>{exportReview.modeLabel}</strong>.
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy || !canSubmitExport}
              onClick={() => void handleExport()}
              className={btnSuccess}
            >
              {busy ? "Enviando..." : "Enviar à turma"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDisconnect()}
              className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800"
            >
              Desconectar
            </button>
          </>
        ) : noTurmasFallback ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDriveOnlyExport()}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
            >
              {busy ? "Salvando…" : "Salvar no Drive e abrir Classroom"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={openClassroomHome}
              className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-800"
            >
              Abrir classroom.google.com
            </button>
          </>
        ) : (
          <>
            <p className="w-full text-sm text-rose-800">
              {error || "Não foi possível carregar o Google Classroom."}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800"
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-sky-800/90">
        O Planify envia o material ao seu Google Drive e cria um material na turma escolhida.
        Sem turmas visíveis, o arquivo fica no Drive e o Classroom abre para você anexar manualmente.
      </p>
    </div>
  );
}
