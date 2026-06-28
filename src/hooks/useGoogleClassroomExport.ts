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
  executeClassroomMaterialExport,
  persistPreferredClassroomCourseId,
  resolveClassroomOAuthStartOptions,
  resolvePreferredClassroomCourseId,
} from "@/lib/google/classroom-export-flow";
import {
  classroomGoogleAccountMismatch,
  classroomGoogleAccountNeedsSwitch,
  isClassroomExportReady,
  isValidGoogleEmail,
  needsClassroomGoogleOAuth,
  persistClassroomGoogleEmail,
  readClassroomGoogleEmail,
  suggestInstitutionalEmail,
} from "@/lib/google/classroom-google-account";
import { resolveGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import { notifyGoogleStatusChanged, GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";
import {
  openGoogleExportUrl,
  saveGoogleExportPending,
} from "@/lib/google/google-export-resume";
import { GOOGLE_CLASSROOM_EXPORT_PENDING_KEY } from "@/lib/google/google-export-resume";
import { useCallback, useEffect, useState } from "react";

type UseGoogleClassroomExportOptions = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  returnTo?: string;
  documentType?: string | null;
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
  const [publishAsDraft, setPublishAsDraft] = useState(false);
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next = await fetchGoogleStatus();
      setStatus(next);

      if (next.connected && isClassroomExportReady(next)) {
        const list = await fetchClassroomCourses();
        setCourses(list);
        setCourseId((current) => current || resolvePreferredClassroomCourseId(list));

        if (list.length === 0) {
          setError(buildClassroomCoursesMessage(next, 0));
        } else {
          setError("");
        }
      } else {
        setCourses([]);
        setCourseId("");

        if (next.connected && classroomGoogleAccountNeedsSwitch(next)) {
          setError(buildClassroomCoursesMessage(next, 0));
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

  const canExport = isClassroomExportReady(status) && courses.length > 0 && Boolean(courseId);
  const canQuickExport = isClassroomExportReady(status);

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

      saveGoogleExportPending(GOOGLE_CLASSROOM_EXPORT_PENDING_KEY, {
        title: title.trim() || "Material Planify",
        returnTo: resolveGoogleOAuthReturnTo(returnTo),
        html: getHtml(),
      });

      const oauthParams = resolveClassroomOAuthStartOptions(status, email);

      await startGoogleOAuth(resolveGoogleOAuthReturnTo(returnTo), oauthParams);
    } catch (err) {
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

  async function handleExport(previewWindow?: Window | null) {
    if (classroomGoogleAccountMismatch(status?.googleEmail)) {
      setError("Conecte a conta Google institucional (@educar.rs.gov.br) antes de enviar.");
      previewWindow?.close();
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await executeClassroomMaterialExport({
        title: title.trim() || "Material Planify",
        html: getHtml(),
        courseId: courseId || undefined,
        description:
          description.trim() ||
          "Material didático enviado pelo Planify.",
        documentType,
        publishState: publishAsDraft ? "DRAFT" : "PUBLISHED",
        onStatus: notify,
      });

      if (courseId) {
        persistPreferredClassroomCourseId(courseId);
      }

      notify(
        result.coursesUsed > 0
          ? publishAsDraft
            ? "Rascunho salvo no Google Classroom."
            : "Material publicado no Google Classroom."
          : "Material salvo no Drive. Abra o Classroom para anexar à turma.",
      );

      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = result.openUrl;
      } else {
        const opened = openGoogleExportUrl(result.openUrl);
        if (!opened) {
          window.location.assign(result.openUrl);
        }
      }
    } catch (err) {
      previewWindow?.close();
      setError(err instanceof Error ? err.message : "Erro ao enviar ao Classroom.");
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickExport(previewWindow?: Window | null) {
    // #region agent log
    fetch("http://127.0.0.1:7718/ingest/9ac33552-969d-48be-9089-3a3b10571400", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5b9381" },
      body: JSON.stringify({
        sessionId: "5b9381",
        hypothesisId: "H-C",
        location: "useGoogleClassroomExport.ts:handleQuickExport",
        message: "quick export branch",
        data: {
          connected: Boolean(status?.connected),
          googleEmailDomain: status?.googleEmail?.split("@")[1] ?? null,
          needsOAuth: needsClassroomGoogleOAuth(status),
          needsSwitch: classroomGoogleAccountNeedsSwitch(status),
          coursesCount: courses.length,
          hasPreviewWindow: Boolean(previewWindow && !previewWindow.closed),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (needsClassroomGoogleOAuth(status)) {
      previewWindow?.close();
      await handleConnect();
      return;
    }

    if (classroomGoogleAccountNeedsSwitch(status)) {
      previewWindow?.close();
      await handleSwitchAccount();
      return;
    }

    await handleExport(previewWindow);
  }

  function openClassroomHome() {
    openGoogleExportUrl(CLASSROOM_HOME_URL);
  }

  const loginRedirect = encodeURIComponent(resolveGoogleOAuthReturnTo(returnTo));

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
    canExport,
    canQuickExport,
    loading,
    busy,
    error,
    setError,
    loginRedirect,
    handleConnect,
    handleSwitchAccount,
    handleDisconnect,
    handleExport,
    handleQuickExport,
    openClassroomHome,
    refresh,
  };
}
