"use client";

import { ClassroomGoogleConnectForm } from "@/components/google/ClassroomGoogleConnectForm";
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { PlanifyModal, PlanifyModalFooter } from "@/components/ui/PlanifyModal";
import {
  CLASSROOM_OPEN_AFTER_OAUTH_KEY,
  useGoogleClassroomExport,
  type ClassroomExportSuccess,
} from "@/hooks/useGoogleClassroomExport";
import {
  classroomGoogleAccountNeedsSwitch,
  needsClassroomGoogleOAuth,
} from "@/lib/google/classroom-google-account";
import type { ClassroomShareType } from "@/lib/google/google-api-client";
import { useEffect, useRef, useState } from "react";

const CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY =
  "planify:classroom-open-after-oauth-button";

type GoogleClassroomShareModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
  oauthButtonId?: string;
};

function shareTypeLabel(value: ClassroomShareType): string {
  return value === "assignment" ? "Atividade" : "Material";
}

export function GoogleClassroomShareModal({
  open,
  onClose,
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
  oauthButtonId,
}: GoogleClassroomShareModalProps) {
  const [materialTitle, setMaterialTitle] = useState(
    title.trim() || "Material Planify",
  );
  const [lastSuccess, setLastSuccess] = useState<ClassroomExportSuccess | null>(null);
  const autoOAuthStartedRef = useRef(false);

  const classroom = useGoogleClassroomExport({
    title: materialTitle,
    getHtml,
    onStatus,
    returnTo,
    documentType,
    enabled: open,
  });

  const needsOAuth = needsClassroomGoogleOAuth(classroom.status);
  const needsAccountSwitch = classroomGoogleAccountNeedsSwitch(classroom.status);
  const connectMode = needsAccountSwitch ? "switch" : "connect";

  useEffect(() => {
    if (!open) return;
    setMaterialTitle(title.trim() || "Material Planify");
    setLastSuccess(null);
    autoOAuthStartedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title]);

  useEffect(() => {
    if (!open || autoOAuthStartedRef.current || classroom.loading || classroom.busy) {
      return;
    }

    if (!classroom.status?.authenticated) return;

    if (classroom.needsEducarConnect || needsOAuth) {
      autoOAuthStartedRef.current = true;
      void connectGoogle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    classroom.loading,
    classroom.busy,
    classroom.status?.authenticated,
    classroom.needsEducarConnect,
    needsOAuth,
  ]);

  function rememberOAuthButtonId() {
    if (!oauthButtonId) return;

    try {
      window.sessionStorage.setItem(
        CLASSROOM_OPEN_AFTER_OAUTH_BUTTON_KEY,
        oauthButtonId,
      );
      window.sessionStorage.setItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function connectGoogle() {
    rememberOAuthButtonId();
    await (connectMode === "switch"
      ? classroom.handleSwitchAccount()
      : classroom.handleConnect());
  }

  async function publish() {
    const result = await classroom.handleExport();
    if (result) {
      setLastSuccess(result);
    }
  }

  function toggleCourse(courseId: string) {
    classroom.setSelectedCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    );
  }

  function selectAllCourses() {
    classroom.setSelectedCourseIds(classroom.courses.map((course) => course.id));
  }

  function clearCourses() {
    classroom.setSelectedCourseIds([]);
  }

  const connectedEmail = classroom.status?.googleEmail || "conta Google";
  const disabledPublish =
    !classroom.canSubmitExport || !materialTitle.trim() || Boolean(lastSuccess);

  function renderBusyProgress() {
    if (!classroom.busy) return null;

    return (
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-sky-950">
            {classroom.progressMessage || "Enviando para Google Classroom..."}
          </p>
          <p className="text-xs font-bold text-sky-700">
            {classroom.selectedCourseIds.length} turma(s)
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-sky-600" />
        </div>
      </div>
    );
  }

  function renderBody() {
    if (classroom.loading) {
      return (
        <div className="px-6 py-6 text-sm font-semibold text-slate-600">
          Verificando conta Google e permissoes do Classroom...
        </div>
      );
    }

    if (!classroom.status?.configured) {
      return (
        <div className="px-6 py-6 text-sm leading-6 text-amber-950">
          Integracao Google nao configurada no servidor. Configure{" "}
          <code className="text-xs">GOOGLE_CLIENT_ID</code>,{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code> e{" "}
          <code className="text-xs">GOOGLE_REDIRECT_URI</code>.
        </div>
      );
    }

    if (!classroom.status.authenticated) {
      return (
        <div className="space-y-4 px-6 py-6 text-sm leading-6 text-slate-700">
          <p>Faca login no Planify para conectar sua conta Google de professor.</p>
          <a
            href={`/login?redirect=${classroom.loginRedirect}`}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white"
          >
            Ir para login
          </a>
        </div>
      );
    }

    if (classroom.needsEducarConnect || needsOAuth) {
      return (
        <div className="px-6 py-5">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Abrindo a autorizacao Google Classroom...
          </p>
          <ClassroomGoogleConnectForm
            institutionalEmail={classroom.institutionalEmail}
            onInstitutionalEmailChange={classroom.setInstitutionalEmail}
            busy={classroom.busy}
            onConnect={() => void connectGoogle()}
            mode={connectMode}
            planifyEmail={classroom.status.planifyEmail}
            connectedGoogleEmail={classroom.status.googleEmail}
            authorizationMissing={classroom.needsClassroomAuthorization}
          />
        </div>
      );
    }

    if (lastSuccess) {
      return (
        <div className="space-y-4 px-6 py-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-black text-emerald-950">
              Material publicado com sucesso.
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              {lastSuccess.exportTitle} foi enviado para {lastSuccess.courseCount}{" "}
              {lastSuccess.courseCount === 1 ? "turma" : "turmas"} como{" "}
              {shareTypeLabel(lastSuccess.shareType).toLowerCase()}.
            </p>
            {lastSuccess.errors.length > 0 ? (
              <p className="mt-2 text-xs font-semibold text-amber-800">
                {lastSuccess.errors.length} turma(s) retornaram alerta. Confira no
                Classroom antes de reenviar.
              </p>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-start gap-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
          <GoogleClassroomIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-800">
              Conectado ao Classroom
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-sky-950">
              {connectedEmail}
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Titulo do material
          </span>
          <input
            type="text"
            value={materialTitle}
            onChange={(event) => setMaterialTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Descricao
          </span>
          <textarea
            value={classroom.description}
            onChange={(event) => classroom.setDescription(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <fieldset>
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Publicar como
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(["material", "assignment"] as ClassroomShareType[]).map((type) => (
              <label
                key={type}
                className={[
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black transition",
                  classroom.shareType === type
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="classroom-share-type"
                  value={type}
                  checked={classroom.shareType === type}
                  onChange={() => classroom.setShareType(type)}
                  className="h-4 w-4 accent-sky-600"
                />
                {shareTypeLabel(type)}
              </label>
            ))}
          </div>
        </fieldset>

        {classroom.shareType === "assignment" ? (
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">
                Data de entrega
              </span>
              <input
                type="date"
                value={classroom.dueDate}
                onChange={(event) => classroom.setDueDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">
                Horario
              </span>
              <input
                type="time"
                value={classroom.dueTime}
                onChange={(event) => classroom.setDueTime(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">
                Nota maxima
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={classroom.maxPoints}
                onChange={(event) => classroom.setMaxPoints(event.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900"
              />
            </label>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Turmas
            </span>
            {classroom.courses.length > 1 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllCourses}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900"
                >
                  Selecionar todas
                </button>
                <button
                  type="button"
                  onClick={clearCourses}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Limpar
                </button>
              </div>
            ) : null}
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
            {classroom.coursesLoading ? (
              <p className="px-2 py-3 text-sm font-semibold text-slate-500">
                Carregando turmas reais do Google Classroom...
              </p>
            ) : classroom.courses.length > 0 ? (
              classroom.courses.map((course) => {
                const label = [course.name, course.section].filter(Boolean).join(" - ");
                const checked = classroom.selectedCourseIds.includes(course.id);

                return (
                  <label
                    key={course.id}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition",
                      checked
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-100 bg-white hover:border-slate-200",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCourse(course.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-sm font-bold text-slate-900">{label}</span>
                  </label>
                );
              })
            ) : (
              <p className="px-2 py-3 text-sm font-semibold text-amber-800">
                Nenhuma turma ativa encontrada para esta conta Google.
              </p>
            )}
          </div>
          {!classroom.coursesLoading && classroom.courses.length === 0 ? (
            <p className="mt-2 text-xs font-semibold text-amber-800">
              Confirme se a conta conectada tem o Classroom habilitado e se voce e
              professor de alguma turma ativa.
            </p>
          ) : null}
        </div>

        {renderBusyProgress()}

        {classroom.error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
            {classroom.error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <PlanifyModal
      open={open}
      onClose={onClose}
      title="Enviar para Google Classroom"
      description="Revise o material, escolha as turmas e confirme a publicacao."
      maxWidth="max-w-2xl"
    >
      {renderBody()}

      {classroom.status?.authenticated && classroom.canOpenClassroomHandoff && !lastSuccess ? (
        <PlanifyModalFooter>
          <button
            type="button"
            disabled={classroom.busy}
            onClick={() => void classroom.handleDisconnect()}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Desconectar
          </button>
          <button
            type="button"
            disabled={classroom.busy || classroom.coursesLoading}
            onClick={() => void classroom.refreshCourses(true)}
            className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50 disabled:opacity-60"
          >
            Atualizar turmas
          </button>
          <button
            type="button"
            disabled={disabledPublish}
            onClick={() => void publish()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {classroom.busy ? "Publicando..." : "Publicar"}
          </button>
        </PlanifyModalFooter>
      ) : lastSuccess ? (
        <PlanifyModalFooter>
          <a
            href={lastSuccess.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-700"
          >
            Abrir no Google Classroom
          </a>
          <button
            type="button"
            onClick={() => setLastSuccess(null)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Publicar novamente
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Fechar
          </button>
        </PlanifyModalFooter>
      ) : null}
    </PlanifyModal>
  );
}
