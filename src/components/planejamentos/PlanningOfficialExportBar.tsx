"use client";

import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import {
  buildPlanningEditorHtml,
  type GeneratedPlanningHtml,
} from "@/lib/planejamentos/planning-editor-html";
import { buildOfficialPlanningPayloadFromGeneration } from "@/lib/planejamentos/planning-google-export-payload";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import { passesExportQualityGate } from "@/lib/materiais/unified-quality-gate";
import { useCallback, useMemo } from "react";

type PlanningFormSlice = {
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  cargaHoraria: string;
  trimestre: string;
};

type PlanningOfficialExportBarProps = {
  title: string;
  form: PlanningFormSlice;
  mode: "anual" | "trimestral";
  trimestre?: number;
  matriz: GeneratedPlanningHtml;
  qualityScore?: number | null;
  qualityIssues?: string[];
  onStatus?: (message: string) => void;
  returnTo?: string;
};

export function PlanningOfficialExportBar({
  title,
  form,
  mode,
  trimestre,
  matriz,
  qualityScore = null,
  qualityIssues = [],
  onStatus,
  returnTo = "/dashboard?secao=planejamentos",
}: PlanningOfficialExportBarProps) {
  const exportBlocked = useMemo(
    () => !passesExportQualityGate(qualityScore, qualityIssues),
    [qualityScore, qualityIssues],
  );
  const exportBlockedTitle = exportBlocked
    ? "A matriz não atingiu o padrão mínimo Planify (88/100). Use Elevar qualidade antes de exportar."
    : undefined;
  const editorForm =
    mode === "trimestral" && trimestre
      ? {
          ...form,
          tipoPlanejamento: "trimestral" as const,
          trimestre: String(trimestre),
          cargaHoraria: trimestralCargaHorariaLabel(matriz.conteudos),
        }
      : { ...form, tipoPlanejamento: "anual" as const };

  const getHtml = useCallback(
    () => buildPlanningEditorHtml(editorForm, matriz),
    [editorForm, matriz],
  );

  const getPlanningPayload = useCallback(
    () =>
      buildOfficialPlanningPayloadFromGeneration({
        tipoPlanejamento: mode,
        escola: form.escola,
        professor: form.professor,
        etapa: form.etapa,
        anoSerie: form.anoSerie,
        areaConhecimento: form.areaConhecimento,
        componenteCurricular: form.componenteCurricular,
        cargaHoraria:
          mode === "trimestral" && trimestre
            ? trimestralCargaHorariaLabel(matriz.conteudos)
            : form.cargaHoraria,
        trimestre: trimestre ? String(trimestre) : form.trimestre,
        matrizPlanejamento: matriz,
        planifyQuality: {
          qualityScore,
          qualityIssues,
        },
      }),
    [form, mode, trimestre, matriz, qualityScore, qualityIssues],
  );

  return (
    <GoogleDocumentExportBar
      title={title || matriz.titulo || "Planejamento"}
      getHtml={getHtml}
      getPlanningPayload={getPlanningPayload}
      documentType={`planejamento:${mode}`}
      returnTo={returnTo}
      onStatus={onStatus}
      disabled={exportBlocked}
      disabledTitle={exportBlockedTitle}
      compact
      classroomMode="popover"
    />
  );
}
