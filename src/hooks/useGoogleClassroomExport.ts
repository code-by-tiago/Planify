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
import {
  classroomGoogleAccountMismatch,
  isEducarInstitutionalEmail,
  isValidGoogleEmail,
  persistClassroomGoogleEmail,
  readClassroomGoogleEmail,
  resolveClassroomOAuthHint,
  suggestInstitutionalEmail,
} from "@/lib/google/classroom-google-account";
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

      if (next.connected) {
        const list = await fetchClassroomCourses();
        setCourses(list);
        setCourseId((current) => current || list[0]?.id || "");

        if (list.length === 0) {
          const googleEmail = next.googleEmail;
          if (classroomGoogleAccountMismatch(googleEmail)) {
            setError(
              googleEmail
                ? `Nenhuma turma encontrada em ${googleEmail}. Conecte sua conta @educar.rs.gov.br da escola.`
                : "Nenhuma turma encontrada. Conecte a conta Google institucional da escola.",
            );
          } else {
            setError(
              googleEmail
                ? `Nenhuma turma de professor encontrada em ${googleEmail}.`
                : "Nenhuma turma de professor encontrada.",
            );
          }
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

  const needsInstitutionalConnect =
    !status?.connected ||
    classroomGoogleAccountMismatch(status?.googleEmail) ||
    courses.length === 0;

  const canExport =
    Boolean(status?.connected) &&
    isEducarInstitutionalEmail(status?.googleEmail) &&
    courses.length > 0 &&
    Boolean(courseId);

  async function connectWithInstitutionalEmail(mode: "connect" | "switch") {
    const email = institutionalEmail.trim().toLowerCase();

    if (!isValidGoogleEmail(email)) {
      setError(
        "Informe o e-mail Google institucional da escola (ex.: nome@educar.rs.gov.br).",
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      persistClassroomGoogleEmail(email);

      if (mode === "switch" && status?.connected) {
        await disconnectGoogle();
      }

      const hint = resolveClassroomOAuthHint(email);
      await startGoogleOAuth(resolveGoogleOAuthReturnTo(returnTo), {
        selectAccount: true,
        loginHint: hint.loginHint,
        hostedDomain: hint.hostedDomain,
      });
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
    await connectWithInstitutionalEmail("connect");
  }

  async function handleSwitchAccount() {
    await connectWithInstitutionalEmail("switch");
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

    if (classroomGoogleAccountMismatch(status?.googleEmail)) {
      setError("Conecte a conta Google institucional (@educar.rs.gov.br) antes de enviar.");
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
    institutionalEmail,
    setInstitutionalEmail,
    needsInstitutionalConnect,
    canExport,
    loading,
    busy,
    error,
    setError,
    loginRedirect,
    handleConnect,
    handleSwitchAccount,
    handleDisconnect,
    handleExport,
    refresh,
  };
}
