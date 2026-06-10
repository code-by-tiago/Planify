"use client";

import { GoogleFormsIcon } from "@/components/google/GoogleFormsIcon";
import { GOOGLE_PRODUCT_ICON_CLASS } from "@/components/google/google-icon-button-styles";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { exportToGoogleForms } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_FORMS_EXPORT_PENDING_KEY = "planify:google-forms-export-pending";

type GoogleFormsExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  className?: string;
  iconOnly?: boolean;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
};

export function GoogleFormsExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  className,
  iconOnly,
  onStatus,
  onExportError,
}: GoogleFormsExportButtonProps) {
  const runExport = useCallback(async (params: { html: string }) => {
    const result = await exportToGoogleForms({
      title,
      html: params.html,
      description: "Formulário criado pelo Planify.",
    });

    return { openUrl: result.formUrl };
  }, [title]);

  return (
    <GoogleProductExportButton
      title={title}
      getHtml={getHtml}
      returnTo={returnTo}
      className={className}
      iconOnly={iconOnly}
      alwaysShowExport
      icon={<GoogleFormsIcon className={GOOGLE_PRODUCT_ICON_CLASS} />}
      productName="Google Forms"
      configLabel="Forms (config)"
      loginLabel="Forms"
      labels={{
        exportConnected: "Google Forms",
        exportConnect: "Conectar Google Forms",
        creating: "Criando…",
        connecting: "Conectando…",
        connect: "Conectar Google",
      }}
      exportTitle="Cria um Google Forms a partir das questões do documento"
      pendingStorageKey={GOOGLE_FORMS_EXPORT_PENDING_KEY}
      onExport={runExport}
      onStatus={onStatus}
      onExportError={onExportError}
    />
  );
}
