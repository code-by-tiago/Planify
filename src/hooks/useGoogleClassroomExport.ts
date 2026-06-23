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
import { resolveGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import { notifyGoogleStatusChanged } from "@/lib/google/google-status-events";
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
            "Conta Google conectada, mas nenhuma turma de professor foi encontrada.",
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

  async function handleExport(previewWindow?: Window | null) {
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
        description:
          description.trim() ||
          "Material didático enviado pelo Planify.",
        documentType,
        publishState: publishAsDraft ? "DRAFT" : "PUBLISHED",
      });

      const link =
        result.classroom?.alternateLink || result.drive.webViewLink || "";

      notify(
        publishAsDraft
          ? link
            ? "Rascunho salvo no Google Classroom."
            : "Rascunho enviado ao Drive e registrado na turma."
          : link
            ? "Material publicado no Google Classroom."
            : "Material enviado ao Drive e publicado na turma.",
      );

      if (link) {
        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = link;
        } else {
          window.open(link, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar ao Classroom.");
    } finally {
      setBusy(false);
    }
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
    loading,
    busy,
    error,
    setError,
    loginRedirect,
    handleConnect,
    handleDisconnect,
    handleExport,
    refresh,
  };
}
