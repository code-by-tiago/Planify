"use client";

import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { GOOGLE_PRODUCT_ICON_CLASS } from "@/components/google/google-icon-button-styles";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import {
  classroomGoogleAccountNeedsSwitch,
  isClassroomExportReady,
} from "@/lib/google/classroom-google-account";
import { executeClassroomMaterialExport, resolveClassroomOAuthStartOptions } from "@/lib/google/classroom-export-flow";
import { GOOGLE_CLASSROOM_EXPORT_PENDING_KEY, openGoogleExportUrl } from "@/lib/google/google-export-resume";
import { useCallback } from "react";

export { GOOGLE_CLASSROOM_EXPORT_PENDING_KEY };

type GoogleClassroomExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  documentType?: string | null;
  className?: string;
  iconOnly?: boolean;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
};

export function GoogleClassroomExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  documentType,
  className,
  iconOnly = true,
  onStatus,
  onExportError,
}: GoogleClassroomExportButtonProps) {
  const runExport = useCallback(async (params: {
    html: string;
    previewWindow?: Window | null;
  }) => {
    const result = await executeClassroomMaterialExport({
      title,
      html: params.html,
      documentType,
      onStatus,
    });

    const previewWindow = params.previewWindow;
    let openedInPreview = false;

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = result.openUrl;
      openedInPreview = true;
    } else {
      const opened = openGoogleExportUrl(result.openUrl);
      if (!opened) {
        window.location.assign(result.openUrl);
        openedInPreview = true;
      }
    }

    if (result.coursesUsed > 0) {
      onStatus?.("Material publicado no Google Classroom.");
    } else {
      onStatus?.("Material salvo no Drive. Abra o Classroom para anexar à turma.");
    }

    return {
      openUrl: result.openUrl,
      openedInPreview,
    };
  }, [documentType, onStatus, title]);

  const getOAuthOptions = useCallback(
    (status: Parameters<typeof resolveClassroomOAuthStartOptions>[0]) =>
      resolveClassroomOAuthStartOptions(status),
    [],
  );

  return (
    <GoogleProductExportButton
      title={title}
      getHtml={getHtml}
      returnTo={returnTo}
      className={className}
      iconOnly={iconOnly}
      alwaysShowExport
      icon={<GoogleClassroomIcon className={GOOGLE_PRODUCT_ICON_CLASS} />}
      productName="Google Classroom"
      configLabel="Classroom (config)"
      loginLabel="Classroom"
      labels={{
        exportConnected: "Google Classroom",
        exportConnect: "Conectar Google Classroom",
        creating: "Enviando…",
        connecting: "Conectando…",
        connect: "Conectar Google",
      }}
      exportTitle="Enviar ao Google Classroom"
      pendingStorageKey={GOOGLE_CLASSROOM_EXPORT_PENDING_KEY}
      onExport={runExport}
      onStatus={onStatus}
      onExportError={onExportError}
      isExportReady={isClassroomExportReady}
      needsExtraScope={classroomGoogleAccountNeedsSwitch}
      extraScopeLabel="Trocar para conta @educar.rs.gov.br"
      getOAuthOptions={getOAuthOptions}
    />
  );
}
