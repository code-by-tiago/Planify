"use client";

import {
  disconnectGoogle,
  fetchClassroomCourses,
  fetchGoogleStatus,
  startGoogleOAuth,
  type ClassroomCourseOption,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  CLASSROOM_HOME_URL,
  buildClassroomCoursesMessage,
  executeClassroomDriveOnlyExport,
  executeClassroomMaterialExport,
  persistPreferredClassroomCourseId,
  resolveClassroomOAuthStartOptions,
  resolvePreferredClassroomCourseId,
} from "@/lib/google/classroom-export-flow";
import {
  classroomGoogleAccountMismatch,
  classroomGoogleScopesMissing,
  isClassroomExportReady,
  isEducarInstitutionalEmail,
  isValidGoogleEmail,
  needsEducarClassroomConnect,
  persistClassroomGoogleEmail,
  readClassroomGoogleEmail,
  suggestInstitutionalEmail,
} from "@/lib/google/classroom-google-account";
import {
  assertClassroomClientExportAllowed,
  buildClassroomExportReviewSummary,
  buildClassroomExportSuccessMessage,
  recordClassroomClientExport,
  resolveSelectedCourseLabel,
} from "@/lib/google/classroom-export-client-guard";
import { resolveGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import {
  openGoogleExportUrl,
  peekGoogleOAuthResumeIntent,
} from "@/lib/google/google-export-resume";
import {
  GOOGLE_STATUS_CHANGED_EVENT,
  notifyGoogleStatusChanged,
} from "@/lib/google/google-status-events";
import { agentDebugLog } from "@/lib/debug/agent-debug-log";
import { useCallback, useEffect, useState } from "react";

export const CLASSROOM_OPEN_AFTER_OAUTH_KEY = "planify:classroom-open-after-oauth";

type UseGoogleClassroomExportOptions = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
};

export type ClassroomExportSuccess = {
  openUrl: string;
  coursesUsed: number;
  asDraft: boolean;
  courseLabel: string;
  exportTitle: string;
};

export function useGoogleClassroomExport({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
}: UseGoogleClassroomExportOptions) {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [courses, setCourses] = useState<ClassroomCourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [publishAsDraft, setPublishAsDraft] = useState(true);
  const [institutionalEmail, setInstitutionalEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const notify = useCallback(
    (message: string) => {
      onStatus?.(message);
    },
    [onStatus],
  );

  useEffect(() => {
    setInstitutionalEmail((current) => current || readClassroomGoogleEmail());
  }, []);

  useEffect(() => {
    if (!status?.planifyEmail) return;

    setInstitutionalEmail((current) =>
      suggestInstitutionalEmail(status.planifyEmail, current),
    );
  }, [status?.planifyEmail]);

  useEffect(() => {
    if (!isEducarInstitutionalEmail(status?.googleEmail)) return;

    setInstitutionalEmail((current) =>
      isEducarInstitutionalEmail(current) ? current : status?.googleEmail || current,
    );
  }, [status?.googleEmail]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next = await fetchGoogleStatus();
      setStatus(next);

      // #region agent log
      agentDebugLog({
        hypothesisId: "H-C",
        location: "useGoogleClassroomExport.ts:refresh:status",
        message: "google status loaded",
        data: {
          configured: Boolean(next.configured),
          authenticated: Boolean(next.authenticated),
          connected: Boolean(next.connected),
          exportReady: isClassroomExportReady(next),
          needsEducar: needsEducarClassroomConnect(next),
          classroomScopeGranted: Boolean(next.classroomScopeGranted),
          missingClassroomScopes: next.missingClassroomScopes || [],
          googleEmailDomain: next.googleEmail?.split("@")[1] ?? null,
        },
      });
      // #endregion

      if (next.connected && isClassroomExportReady(next)) {
        try {
          const list = await fetchClassroomCourses();
          setCourses(list);
          setCourseId((current) => {
            if (current && list.some((course) => course.id === current)) {
              return current;
            }
            return resolvePreferredClassroomCourseId(list);
          });

          if (list.length === 0) {
            setError(buildClassroomCoursesMessage(next, 0));
          } else {
            setError("");
          }

          // #region agent log
          agentDebugLog({
            hypothesisId: "H-E",
            location: "useGoogleClassroomExport.ts:refresh:courses",
            message: "classroom courses loaded",
            data: { coursesCount: list.length },
          });
          // #endregion
        } catch (coursesError) {
          setCourses([]);
          setCourseId("");
          setError(
            coursesError instanceof Error
              ? coursesError.message
              : "Não foi possível carregar turmas do Classroom.",
          );

          // #region agent log
          agentDebugLog({
            hypothesisId: "H-E",
            location: "useGoogleClassroomExport.ts:refresh:coursesError",
            message: "classroom courses failed",
            data: {
              error:
                coursesError instanceof Error ? coursesError.message : "unknown",
            },
          });
          // #endregion
        }
      } else {
        setCourses([]);
        setCourseId("");

        if (next.connected && needsEducarClassroomConnect(next)) {
          setError(buildClassroomCoursesMessage(next, 0));
        } else if (!next.connected) {
          setError("");
        }
      }
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
    if (peekGoogleOAuthResumeIntent()?.connected) {
      void refresh();
    }
  }, [refresh]);

  useEffect(() => {
    const onStatusChanged = () => {
      setBusy(false);
      void refresh();
    };

    let focusTimer: number | undefined;

    const onFocus = () => {
      setBusy(false);
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => {
        void refresh();
      }, 500);
    };

    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, onStatusChanged);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, onStatusChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const needsEducarConnect = needsEducarClassroomConnect(status);
  const needsClassroomAuthorization = classroomGoogleScopesMissing(status);
  const statusReady = !loading && status !== null;
  const canShowTurmaList = isClassroomExportReady(status) && courses.length > 0;
  const canSubmitExport = canShowTurmaList && Boolean(courseId.trim());
  const noTurmasFallback = isClassroomExportReady(status) && courses.length === 0;

  async function startClassroomGoogleOAuth(mode: "connect" | "switch") {
    setBusy(true);
    setError("");

    try {
      const email = institutionalEmail.trim().toLowerCase();
      if (isValidGoogleEmail(email)) {
        persistClassroomGoogleEmail(email);
      }

      if (mode === "switch" && status?.connected) {
        await disconnectGoogle();
      }

      try {
        window.sessionStorage.removeItem("planify:classroom-open-after-oauth-handled");
        window.sessionStorage.setItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY, "1");
      } catch {
        /* ignore */
      }

      const oauthParams = resolveClassroomOAuthStartOptions(status, email);

      await startGoogleOAuth(resolveGoogleOAuthReturnTo(returnTo), oauthParams);
    } catch (err) {
      try {
        window.sessionStorage.removeItem(CLASSROOM_OPEN_AFTER_OAUTH_KEY);
      } catch {
        /* ignore */
      }
      setError(
        err instanceof Error
          ? err.message
          : mode === "switch"
            ? "Erro ao trocar conta Google."
            : "Erro ao conectar Google.",
      );
      setBusy(false);
    }
  }

  async function handleConnect() {
    await startClassroomGoogleOAuth("connect");
  }

  async function handleSwitchAccount() {
    await startClassroomGoogleOAuth("switch");
  }

  async function handleDisconnect() {
    setBusy(true);
    setError("");

    try {
      await disconnectGoogle();
      notify("Conta Google desconectada.");
      await refresh();
      notifyGoogleStatusChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desconectar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(
    previewWindow?: Window | null,
  ): Promise<ClassroomExportSuccess | null> {
    if (classroomGoogleAccountMismatch(status?.googleEmail)) {
      setError("Conecte a conta Google institucional (@educar.rs.gov.br) antes de enviar.");
      previewWindow?.close();
      return null;
    }

    if (!courseId.trim()) {
      setError("Selecione a turma antes de enviar.");
      previewWindow?.close();
      return null;
    }

    const exportTitle = title.trim() || "Material Planify";
    const exportHtml = getHtml();
    const selectedCourseId = courseId.trim();
    const asDraft = publishAsDraft;
    const courseLabel = resolveSelectedCourseLabel(courses, selectedCourseId);

    try {
      assertClassroomClientExportAllowed({
        courseId: selectedCourseId,
        title: exportTitle,
        html: exportHtml,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envio duplicado bloqueado.");
      previewWindow?.close();
      return null;
    }

    setBusy(true);
    setError("");

    try {
      const result = await executeClassroomMaterialExport({
        title: exportTitle,
        html: exportHtml,
        courseId: selectedCourseId,
        description:
          description.trim() ||
          "Material didático enviado pelo Planify.",
        documentType,
        publishState: asDraft ? "DRAFT" : "PUBLISHED",
        onStatus: notify,
      });

      recordClassroomClientExport({
        courseId: selectedCourseId,
        title: exportTitle,
        html: exportHtml,
      });

      persistPreferredClassroomCourseId(selectedCourseId);

      const successMessage = buildClassroomExportSuccessMessage({
        asDraft,
        courseLabel,
      });

      notify(
        result.coursesUsed > 0
          ? successMessage
          : "Material salvo no Drive. Abra o Classroom para anexar à turma.",
      );

      openExportResultUrl(result.openUrl, previewWindow);

      return {
        openUrl: result.openUrl,
        coursesUsed: result.coursesUsed,
        asDraft,
        courseLabel,
        exportTitle,
      };
    } catch (err) {
      previewWindow?.close();
      setError(err instanceof Error ? err.message : "Erro ao enviar ao Classroom.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleDriveOnlyExport(previewWindow?: Window | null) {
    setBusy(true);
    setError("");

    try {
      const result = await executeClassroomDriveOnlyExport({
        title: title.trim() || "Material Planify",
        html: getHtml(),
        documentType,
        onStatus: notify,
      });

      notify("Material salvo no Drive. Abra o Classroom para anexar à turma.");
      openExportResultUrl(result.openUrl, previewWindow);
    } catch (err) {
      previewWindow?.close();
      setError(err instanceof Error ? err.message : "Erro ao salvar no Drive.");
    } finally {
      setBusy(false);
    }
  }

  function openExportResultUrl(openUrl: string, previewWindow?: Window | null) {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = openUrl;
      return;
    }

    const opened = openGoogleExportUrl(openUrl);
    if (!opened) {
      window.location.assign(openUrl);
    }
  }

  function openClassroomHome() {
    openGoogleExportUrl(CLASSROOM_HOME_URL);
  }

  const loginRedirect = encodeURIComponent(resolveGoogleOAuthReturnTo(returnTo));
  const exportTitle = title.trim() || "Material Planify";
  const courseLabel = resolveSelectedCourseLabel(courses, courseId);
  const exportReview = buildClassroomExportReviewSummary({
    title: exportTitle,
    courseLabel,
    asDraft: publishAsDraft,
  });

  return {
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
    statusReady,
    canShowTurmaList,
    canSubmitExport,
    noTurmasFallback,
    exportReview,
    loading,
    busy,
    error,
    setError,
    loginRedirect,
    handleConnect,
    handleSwitchAccount,
    handleDisconnect,
    handleExport,
    handleDriveOnlyExport,
    openClassroomHome,
    refresh,
  };
}
