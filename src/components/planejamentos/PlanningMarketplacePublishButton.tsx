"use client";

import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import type { GeneratedPlanningHtml } from "@/lib/planejamentos/planning-editor-html";
import {
  normalizeOfficialPayloadInput,
  resolvePlanningEditorHtml,
} from "@/lib/planejamentos/planning-official-editor-html-client";
import { buildOfficialPlanningPayloadFromGeneration } from "@/lib/planejamentos/planning-google-export-payload";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type PlanningMarketplacePublishButtonProps = {
  title: string;
  form: PlanningFormSlice;
  mode: "anual" | "trimestral";
  trimestre?: number;
  matriz: GeneratedPlanningHtml;
  qualityScore?: number | null;
  qualityIssues?: string[];
  tema?: string;
  componente?: string;
  etapa?: string;
  anoSerie?: string;
  className?: string;
  label?: string;
  compact?: boolean;
};

export function PlanningMarketplacePublishButton({
  title,
  form,
  mode,
  trimestre,
  matriz,
  qualityScore = null,
  qualityIssues = [],
  tema,
  componente,
  etapa,
  anoSerie,
  className,
  label,
  compact,
}: PlanningMarketplacePublishButtonProps) {
  const [cachedOfficialHtml, setCachedOfficialHtml] = useState("");

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
  }, [mode, form, trimestre, matriz, qualityScore, qualityIssues, editorForm]);

  const getHtml = useCallback(() => cachedOfficialHtml, [cachedOfficialHtml]);

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
    <MarketplacePublishButton
      title={title || matriz.titulo || "Planejamento"}
      getHtml={getHtml}
      getPlanningPayload={getPlanningPayload}
      tipoMaterial="Planejamento"
      tema={tema}
      componente={componente}
      etapa={etapa}
      anoSerie={anoSerie}
      disabled={!cachedOfficialHtml}
      className={className}
      label={label}
      compact={compact}
    />
  );
}
