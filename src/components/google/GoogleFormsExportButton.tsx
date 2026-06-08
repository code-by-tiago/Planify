"use client";

import { GoogleFormsIcon } from "@/components/google/GoogleFormsIcon";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { exportToGoogleForms } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_FORMS_EXPORT_PENDING_KEY = "planify:google-forms-export-pending";

type GoogleFormsExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  className?: string;
  onStatus?: (message: string) => void;
};

export function GoogleFormsExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  className,
  onStatus,
}: GoogleFormsExportButtonProps) {
  const runExport = useCallback(async () => {
    const result = await exportToGoogleForms({
      title,
      html: getHtml(),
      description: "Formulário criado pelo Planify.",
    });

    return { openUrl: result.formUrl };
  }, [getHtml, title]);

  return (
    <GoogleProductExportButton
      title={title}
      returnTo={returnTo}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-800 disabled:opacity-60"
      }
      alwaysShowExport
      icon={<GoogleFormsIcon className="h-4 w-4 shrink-0" />}
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
    />
  );
}
