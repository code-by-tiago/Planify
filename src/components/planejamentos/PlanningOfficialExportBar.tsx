"use client";

import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
<<<<<<< HEAD
import {
  buildPlanningEditorHtml,
  type GeneratedPlanningHtml,
} from "@/lib/planejamentos/planning-editor-html";
import { buildOfficialPlanningPayloadFromGeneration } from "@/lib/planejamentos/planning-google-export-payload";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import { passesExportQualityGate } from "@/lib/materiais/unified-quality-gate";
import { useCallback, useMemo } from "react";
=======
import type { GeneratedPlanningHtml } from "@/lib/planejamentos/planning-editor-html";
import {
  normalizeOfficialPayloadInput,
  resolvePlanningEditorHtml,
} from "@/lib/planejamentos/planning-official-editor-html-client";
import { buildOfficialPlanningPayloadFromGeneration } from "@/lib/planejamentos/planning-google-export-payload";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import { passesExportQualityGate } from "@/lib/materiais/unified-quality-gate";
import { useCallback, useEffect, useMemo, useState } from "react";
>>>>>>> origin/aplicar-melhorias-na-producao

type PlanningFormSlice = {
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  turma?: string;
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
<<<<<<< HEAD
=======
  /** HTML oficial já resolvido (evita re-fetch). */
  officialHtml?: string | null;
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
}: PlanningOfficialExportBarProps) {
=======
  officialHtml = null,
}: PlanningOfficialExportBarProps) {
  const [cachedOfficialHtml, setCachedOfficialHtml] = useState(
    typeof officialHtml === "string" && officialHtml.includes('data-planify-html-source="official-docx"')
      ? officialHtml
      : "",
  );

>>>>>>> origin/aplicar-melhorias-na-producao
  const exportBlocked = useMemo(
    () => !passesExportQualityGate(qualityScore, qualityIssues),
    [qualityScore, qualityIssues],
  );
  const exportBlockedTitle = exportBlocked
    ? "A matriz não atingiu o padrão mínimo Planify (88/100). Use Elevar qualidade antes de exportar."
    : undefined;
<<<<<<< HEAD
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

=======

  const editorForm = useMemo(
    () =>
      mode === "trimestral" && trimestre
        ? {
            ...form,
            tipoPlanejamento: "trimestral" as const,
            trimestre: String(trimestre),
            cargaHoraria: trimestralCargaHorariaLabel(matriz.conteudos),
          }
        : { ...form, tipoPlanejamento: "anual" as const },
    [form, mode, trimestre, matriz.conteudos],
  );

  useEffect(() => {
    if (
      typeof officialHtml === "string" &&
      officialHtml.includes('data-planify-html-source="official-docx"')
    ) {
      setCachedOfficialHtml(officialHtml);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { html } = await resolvePlanningEditorHtml({
          officialPayloadInput: normalizeOfficialPayloadInput({
            tipoPlanejamento: mode,
            escola: form.escola,
            professor: form.professor,
            etapa: form.etapa,
            anoSerie: form.anoSerie,
            turma: form.turma,
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
          fallbackForm: editorForm,
          fallbackPlanning: matriz,
          exportContext: {
            documentType: `planejamento:${mode}`,
          },
        });

        if (!cancelled) {
          setCachedOfficialHtml(html);
        }
      } catch {
        if (!cancelled) {
          setCachedOfficialHtml("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    officialHtml,
    mode,
    form,
    trimestre,
    matriz,
    qualityScore,
    qualityIssues,
    editorForm,
  ]);

  const getHtml = useCallback(() => cachedOfficialHtml, [cachedOfficialHtml]);

>>>>>>> origin/aplicar-melhorias-na-producao
  const getPlanningPayload = useCallback(
    () =>
      buildOfficialPlanningPayloadFromGeneration({
        tipoPlanejamento: mode,
        escola: form.escola,
        professor: form.professor,
        etapa: form.etapa,
        anoSerie: form.anoSerie,
        turma: form.turma,
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
<<<<<<< HEAD
      disabled={exportBlocked}
      disabledTitle={exportBlockedTitle}
=======
      disabled={exportBlocked || !cachedOfficialHtml}
      disabledTitle={
        exportBlocked
          ? exportBlockedTitle
          : !cachedOfficialHtml
            ? "Carregando modelo oficial…"
            : undefined
      }
>>>>>>> origin/aplicar-melhorias-na-producao
      compact
      classroomMode="popover"
    />
  );
}
