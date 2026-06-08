"use client";

import {
  disconnectGoogle,
  exportToGoogleClassroom,
  fetchClassroomCourses,
  fetchGoogleStatus,
  startGoogleOAuth,
  type ClassroomCourseOption,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import { notifyGoogleStatusChanged } from "@/lib/google/google-status-events";
import { useCallback, useEffect, useState } from "react";
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";

type GoogleClassroomPanelProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  /** Barra horizontal compacta no editor */
  compact?: boolean;
  /** Destino após OAuth Google (ex.: /dashboard?secao=historico) */
  returnTo?: string;
};

function resolveGoogleOAuthReturnTo(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window === "undefined") return "/dashboard?secao=editor";

  const { pathname, search } = window.location;
  if (pathname.startsWith("/dashboard")) return pathname + search;
  if (pathname === "/historico") return "/dashboard?secao=historico";
  return "/editor";
}

export function GoogleClassroomPanel({
  title,
  getHtml,
  onStatus,
  compact = false,
  returnTo,
}: GoogleClassroomPanelProps) {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [courses, setCourses] = useState<ClassroomCourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const notify = useCallback(
    (message: string) => {
      onStatus?.(message);
    },
    [onStatus],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next = await fetchGoogleStatus();
      setStatus(next);

      if (next.connected) {
        const list = await fetchClassroomCourses();
        setCourses(list);
        setCourseId((current) => current || list[0]?.id || "");

        if (list.length === 0) {
          setError(
            "Conta Google conectada, mas nenhuma turma de professor foi encontrada. Use uma conta com perfil de professor no Google Classroom.",
          );
        }
      } else {
        setCourses([]);
        setCourseId("");
      }

      notifyGoogleStatusChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar integração Google.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("google") === "connected") {
      notify("Conta Google conectada com sucesso.");
      params.delete("google");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
      void refresh();
    }

    const googleError = params.get("google_error");

    if (googleError) {
      setError(decodeURIComponent(googleError));
      params.delete("google_error");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
    }
  }, [notify, refresh]);

  async function handleConnect() {
    setBusy(true);
    setError("");

    try {
      await startGoogleOAuth(resolveGoogleOAuthReturnTo(returnTo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar Google.");
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError("");

    try {
      await disconnectGoogle();
      notify("Conta Google desconectada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desconectar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    if (!courseId) {
      setError("Selecione uma turma do Google Classroom.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await exportToGoogleClassroom({
        title: title.trim() || "Material Planify",
        html: getHtml(),
        courseId,
        description: "Material didático enviado pelo Planify.",
      });

      const link =
        result.classroom?.alternateLink || result.drive.webViewLink || "";

      notify(
        link
          ? "Material publicado no Google Classroom."
          : "Material enviado ao Drive e publicado na turma.",
      );

      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar ao Classroom.");
    } finally {
      setBusy(false);
    }
  }

  const btnPrimary = compact
    ? "inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white transition hover:bg-sky-700 disabled:opacity-60"
    : "inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-60";

  const btnSuccess = compact
    ? "rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
    : "rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60";

  if (loading) {
    return compact ? (
      <span className="text-[11px] font-semibold text-sky-700">Google…</span>
    ) : (
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-900">
        Verificando integração Google...
      </div>
    );
  }

  if (!status?.configured) {
    return compact ? (
      <span
        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900"
        title="Configure GOOGLE_CLIENT_ID no servidor"
      >
        Classroom (config)
      </span>
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
    const loginRedirect = encodeURIComponent(resolveGoogleOAuthReturnTo(returnTo));

    return compact ? (
      <a
        href={`/login?redirect=${loginRedirect}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
      >
        <GoogleClassroomIcon className="h-4 w-4" />
        Classroom
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
          >
            <GoogleClassroomIcon className="h-4 w-4 shrink-0" />
            {busy ? "Google…" : "Classroom"}
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
                <option value="">Sem turmas</option>
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
            >
              {busy ? "…" : "Classroom"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDisconnect()}
              title="Desconectar Google"
              className="rounded-xl border border-sky-200 bg-white px-2 py-2 text-xs font-bold text-sky-800"
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
        Configure o projeto em{" "}
        <a
          href="https://console.cloud.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline"
        >
          Google Cloud Console
        </a>
        .
      </p>
    </div>
  );
}
