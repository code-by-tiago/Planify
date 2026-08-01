"use client";

import {
  disconnectGoogle,
  fetchGoogleStatus,
  startGoogleClassroomOAuth,
  type ClassroomCourseOption,
  type ClassroomShareType,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  CLASSROOM_HOME_URL,
  buildClassroomCoursesMessage,
  clearClassroomCoursesCache,
  executeClassroomDriveOnlyExport,
  executeClassroomMaterialExport,
  loadClassroomCourses,
  resolveClassroomOAuthStartOptions,
} from "@/lib/google/classroom-export-flow";
import {
  classroomGoogleAccountNeedsSwitch,
  classroomGoogleScopesMissing,
  isClassroomExportReady,
  isEducarInstitutionalEmail,
  isValidGoogleEmail,
  needsClassroomGoogleOAuth,
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
} from "@/lib/google/classroom-export-client-guard";
import { resolveGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import {
  openGoogleExportUrl,
} from "@/lib/google/google-export-resume";
import {
  GOOGLE_STATUS_CHANGED_EVENT,
  notifyGoogleStatusChanged,
} from "@/lib/google/google-status-events";
import { agentDebugLog } from "@/lib/debug/agent-debug-log";
import { useCallback, useEffect, useMemo, useState } from "react";

export const CLASSROOM_OPEN_AFTER_OAUTH_KEY = "planify:classroom-open-after-oauth";
const DEFAULT_CLASSROOM_DUE_TIME = "23:59";

type UseGoogleClassroomExportOptions = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
  enabled?: boolean;
};

export type ClassroomExportSuccess = {
  openUrl: string;
  exportTitle: string;
  googleEmail: string | null;
  courseLabel: string;
  courseCount: number;
  shareType: ClassroomShareType;
  errors: Array<{ courseId: string; message: string }>;
};

function defaultClassroomDescription(title: string): string {
  return `Material "${title || "Planify"}" preparado no Planify.`;
}

function getCourseLabel(course: ClassroomCourseOption | null | undefined): string {
  if (!course) return "";
  return [course.name, course.section].filter(Boolean).join(" - ");
}

export function useGoogleClassroomExport({
  title,
  getHtml,
  onStatus,
  returnTo,
  documentType,
  enabled = true,
}: UseGoogleClassroomExportOptions) {
  const exportTitle = title.trim() || "Material Planify";
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [institutionalEmail, setInstitutionalEmail] = useState("");
  const [courses, setCourses] = useState<ClassroomCourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [description, setDescription] = useState(defaultClassroomDescription(exportTitle));
  const [shareType, setShareType] = useState<ClassroomShareType>("material");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");

  const notify = useCallback(
    (message: string) => {
      setProgressMessage(message);
      onStatus?.(message);
    },
    [onStatus],
  );

  useEffect(() => {
    setInstitutionalEmail((current) => current || readClassroomGoogleEmail());
  }, []);

  useEffect(() => {
    setDescription((current) =>
      current.trim() ? current : defaultClassroomDescription(exportTitle),
    );
  }, [exportTitle]);

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

  const selectedCourses = useMemo(
    () => courses.filter((course) => selectedCourseIds.includes(course.id)),
    [selectedCourseIds, courses],
  );
  const selectedCourseLabel =
    selectedCourses.length === 1
      ? getCourseLabel(selectedCourses[0])
      : selectedCourses.length > 1
        ? `${selectedCourses.length} turmas`
        : "";

  const loadCoursesForStatus = useCallback(
    async (
      nextStatus: GoogleIntegrationStatus | null,
      options: { forceRefresh?: boolean } = {},
    ) => {
      if (!nextStatus || !isClassroomExportReady(nextStatus)) {
        setCourses([]);
        setSelectedCourseIds([]);
        return;
      }

      setCoursesLoading(true);
      setError("");

      try {
        const nextCourses = await loadClassroomCourses({
          onStatus: notify,
          googleEmail: nextStatus.googleEmail,
          forceRefresh: options.forceRefresh,
        });
        setCourses(nextCourses);
        setSelectedCourseIds((current) => {
          const valid = current.filter((courseId) =>
            nextCourses.some((course) => course.id === courseId),
          );
          if (valid.length > 0) return valid;
          return nextCourses.length === 1 ? [nextCourses[0].id] : [];
        });

        if (nextCourses.length === 0) {
          setError(buildClassroomCoursesMessage(nextStatus, 0));
        }
      } catch (err) {
        setCourses([]);
        setSelectedCourseIds([]);
        setError(err instanceof Error ? err.message : "Erro ao carregar turmas.");
      } finally {
        setCoursesLoading(false);
      }
    },
    [notify],
  );

  const refresh = useCallback(async (options: {
    loadCourses?: boolean;
    forceCourses?: boolean;
  } = {}) => {
    if (!enabled) return;

    setLoading(true);
    if (options.loadCourses || options.forceCourses) {
      setError("");
    }

    try {
      const next = await fetchGoogleStatus();
      setStatus(next);

      agentDebugLog({
        hypothesisId: "H-C",
        location: "useGoogleClassroomExport.ts:refresh:status",
        message: "google status loaded for classroom api share",
        data: {
          configured: Boolean(next.configured),
          authenticated: Boolean(next.authenticated),
          connected: Boolean(next.connected),
          exportReady: isClassroomExportReady(next),
          needsOAuth: needsClassroomGoogleOAuth(next),
          classroomScopeGranted: Boolean(next.classroomScopeGranted),
          missingClassroomScopes: next.missingClassroomScopes || [],
          googleEmailDomain: next.googleEmail?.split("@")[1] ?? null,
        },
      });

      if (next.connected && !isClassroomExportReady(next)) {
        setError(buildClassroomCoursesMessage(next, 0));
        setCourses([]);
        setSelectedCourseIds([]);
      } else if (isClassroomExportReady(next) && options.loadCourses) {
        await loadCoursesForStatus(next, {
          forceRefresh: options.forceCourses,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar integracao Google.");
    } finally {
      setLoading(false);
    }
  }, [enabled, loadCoursesForStatus]);

  useEffect(() => {
    if (!enabled) return;
    void refresh({ loadCourses: true });
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled, refresh]);

  const needsEducarConnect = needsEducarClassroomConnect(status);
  const needsClassroomAuthorization = classroomGoogleScopesMissing(status);
  const statusReady = !loading && status !== null;
  const canOpenClassroomHandoff = isClassroomExportReady(status);
  const canSubmitExport =
    canOpenClassroomHandoff && selectedCourseIds.length > 0 && courses.length > 0 && !busy;

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

      await startGoogleClassroomOAuth(resolveGoogleOAuthReturnTo(returnTo), oauthParams);
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
      clearClassroomCoursesCache();
      setCourses([]);
      setSelectedCourseIds([]);
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
    if (!isClassroomExportReady(status)) {
      setError(buildClassroomCoursesMessage(status, courses.length));
      previewWindow?.close();
      return null;
    }

    if (selectedCourseIds.length === 0) {
      setError("Selecione ao menos uma turma do Google Classroom antes de publicar.");
      previewWindow?.close();
      return null;
    }

    const exportHtml = getHtml();

    try {
      assertClassroomClientExportAllowed({
        title: exportTitle,
        html: exportHtml,
        courseId: selectedCourseIds.join(","),
        shareType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publicacao duplicada bloqueada.");
      previewWindow?.close();
      return null;
    }

    setBusy(true);
    setError("");
    setProgressMessage("Enviando para Google Classroom...");

    try {
      const assignmentDueDate = shareType === "assignment" ? dueDate.trim() : "";
      const assignmentDueTime =
        shareType === "assignment" && assignmentDueDate
          ? dueTime.trim() || DEFAULT_CLASSROOM_DUE_TIME
          : "";

      if (assignmentDueDate && !dueTime.trim()) {
        setDueTime(DEFAULT_CLASSROOM_DUE_TIME);
      }

      const result = await executeClassroomMaterialExport({
        title: exportTitle,
        html: exportHtml,
        courseIds: selectedCourseIds,
        shareType,
        description,
        dueDate: assignmentDueDate && assignmentDueTime ? assignmentDueDate : undefined,
        dueTime: assignmentDueDate && assignmentDueTime ? assignmentDueTime : undefined,
        maxPoints: shareType === "assignment" ? maxPoints : undefined,
        documentType,
        onStatus: notify,
      });

      recordClassroomClientExport({
        title: exportTitle,
        html: exportHtml,
        courseId: selectedCourseIds.join(","),
        shareType,
      });

      notify(buildClassroomExportSuccessMessage());

      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = result.openUrl;
      }

      return {
        openUrl: result.openUrl,
        exportTitle,
        googleEmail: status?.googleEmail ?? null,
        courseLabel: selectedCourseLabel || `${selectedCourseIds.length} turmas`,
        courseCount: result.publicationCount,
        shareType: result.shareType,
        errors: result.errors,
      };
    } catch (err) {
      previewWindow?.close();
      setError(err instanceof Error ? err.message : "Erro ao publicar no Classroom.");
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
        title: exportTitle,
        html: getHtml(),
        documentType,
        onStatus: notify,
      });

      notify("Material salvo no Drive.");
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
  const exportReview = buildClassroomExportReviewSummary({
    title: exportTitle,
  });

  return {
    status,
    institutionalEmail,
    setInstitutionalEmail,
    courses,
    selectedCourseIds,
    setSelectedCourseIds,
    selectedCourses,
    selectedCourseLabel,
    description,
    setDescription,
    shareType,
    setShareType,
    dueDate,
    setDueDate,
    dueTime,
    setDueTime,
    maxPoints,
    setMaxPoints,
    needsEducarConnect,
    needsClassroomAuthorization,
    statusReady,
    canOpenClassroomHandoff,
    canSubmitExport,
    exportReview,
    loading,
    coursesLoading,
    busy,
    error,
    progressMessage,
    setError,
    loginRedirect,
    handleConnect,
    handleSwitchAccount,
    handleDisconnect,
    handleExport,
    handleDriveOnlyExport,
    openClassroomHome,
    refresh,
    refreshCourses: (forceRefresh = false) =>
      loadCoursesForStatus(status, { forceRefresh }),
  };
}
