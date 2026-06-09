"use client";

import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
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

  const btnPrimary = compact
    ? GOOGLE_ICON_ONLY_BUTTON_CLASS
    : "inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-60";

  const btnSuccess = compact
    ? GOOGLE_ICON_ONLY_BUTTON_CLASS
    : "rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60";

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
        {!status.connected ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConnect()}
            className={btnPrimary}
            aria-label={busy ? "Conectando…" : "Conectar Google Classroom"}
            title="Conectar Google Classroom"
          >
            <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
          </button>
        ) : (
          <>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              title="Turma do Google Classroom"
              className="max-w-[min(200px,40vw)] rounded-xl border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
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
            <button
              type="button"
              disabled={busy || !courseId || courses.length === 0}
              onClick={() => void handleExport()}
              className={btnSuccess}
              aria-label={busy ? "Enviando…" : "Enviar ao Classroom"}
              title="Enviar ao Classroom"
            >
              <GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDisconnect()}
              aria-label="Desconectar Google"
              title="Desconectar Google"
              className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
            >
              ✕
            </button>
          </>
        )}
        {error ? (
          <span className="max-w-[200px] truncate text-[11px] font-semibold text-rose-700" title={error}>
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

      {status.connected ? (
        <p className="mt-2 text-sm text-sky-900">
          Conectado como <strong>{status.googleEmail || "conta Google"}</strong>
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-sky-900">
          Conecte sua conta Google (Drive + Classroom) para publicar este material na turma.
        </p>
      )}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!status.connected ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConnect()}
            className={btnPrimary}
          >
            <GoogleClassroomIcon className="h-4 w-4 shrink-0" />
            {busy ? "Abrindo Google..." : "Conectar Google Classroom"}
          </button>
        ) : (
          <>
            <label className="grid w-full min-w-[200px] flex-1 gap-1">
              <span className="text-xs font-bold text-sky-800">Turma</span>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
              >
                {courses.length === 0 ? (
                  <option value="">Nenhuma turma ativa encontrada</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                      {course.section ? ` — ${course.section}` : ""}
                    </option>
                  ))
                )}
              </select>
            </label>

            <button
              type="button"
              disabled={busy || !courseId || courses.length === 0}
              onClick={() => void handleExport()}
              className={btnSuccess}
            >
              {busy ? "Enviando..." : "Enviar ao Classroom"}
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
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-sky-800/90">
        O Planify envia o material ao seu Google Drive e cria uma atividade na turma escolhida.
      </p>
    </div>
  );
}
