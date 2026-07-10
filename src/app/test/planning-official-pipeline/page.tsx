"use client";

import type { GeneratedPlanningHtml } from "@/lib/planejamentos/planning-editor-html";
import {
  detectPlanningHtmlSource,
  normalizeOfficialPayloadInput,
  resolvePlanningEditorHtml,
} from "@/lib/planejamentos/planning-official-editor-html-client";
import { buildTrimestralPlansFromAnnual } from "@/lib/planejamentos/planning-trimestral-from-annual";
import { useEffect, useState } from "react";

const BASE_FORM = {
  escola: "Escola Teste",
  professor: "Prof. Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "Ciências Humanas",
  componenteCurricular: "História",
  cargaHoraria: "60 períodos",
  trimestre: "1",
};

const ANNUAL_PLANNING: GeneratedPlanningHtml = {
  tipoPlanejamento: "anual",
  titulo: "Planejamento anual — História 5º ano",
  resumo: "Fixture E2E pipeline oficial.",
  conteudos: [
    {
      conteudo: "Povos originários do Brasil",
      trimestre: 1,
      numeroAula: 1,
      periodos: 2,
      aulaInicio: 1,
      aulaFim: 2,
      habilidades: [
        {
          codigo: "EF05HI01",
          descricao:
            "Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.",
        },
      ],
      objetivos: "Compreender povos originários.",
      metodologia: "Aula dialogada.",
      recursos: "Livro didático.",
      materiais: "Caderno.",
      etapas: "1. Acolhimento.",
      avaliacao: "Participação.",
      evidencias: "Registros.",
    },
    {
      conteudo: "Colonização e organização do território",
      trimestre: 2,
      numeroAula: 2,
      periodos: 2,
      aulaInicio: 3,
      aulaFim: 4,
      habilidades: [
        {
          codigo: "EF05HI02",
          descricao:
            "Identificar os mecanismos de organização do poder político com vistas à compreensão da ideia de Estado.",
        },
      ],
      objetivos: "Compreender colonização.",
      metodologia: "Mapas e leitura.",
      recursos: "Mapas.",
      materiais: "Caderno.",
      etapas: "1. Investigação.",
      avaliacao: "Mapa preenchido.",
      evidencias: "Mapas.",
    },
    {
      conteudo: "Cidadania e participação social",
      trimestre: 3,
      numeroAula: 3,
      periodos: 2,
      aulaInicio: 5,
      aulaFim: 6,
      habilidades: [
        {
          codigo: "EF05HI01",
          descricao:
            "Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.",
        },
      ],
      objetivos: "Compreender cidadania.",
      metodologia: "Debate.",
      recursos: "Textos.",
      materiais: "Caderno.",
      etapas: "1. Debate.",
      avaliacao: "Participação.",
      evidencias: "Registros.",
    },
  ],
};

type PipelineTabResult = {
  id: string;
  marker: string;
};

type PipelineRunResult = {
  status: "ok" | "error";
  results: PipelineTabResult[];
  error: string;
};

/** Promise única sobrevive remounts (Strict Mode / HMR) durante E2E. */
let pipelineRunPromise: Promise<PipelineRunResult> | null = null;

async function runOfficialPlanningPipeline(): Promise<PipelineRunResult> {
  const trimestralPlans = buildTrimestralPlansFromAnnual(ANNUAL_PLANNING, [1, 2, 3]);
  const documents: Array<{
    id: string;
    mode: "anual" | "trimestral";
    trimestre?: number;
    matriz: GeneratedPlanningHtml;
  }> = [
    { id: "anual", mode: "anual", matriz: ANNUAL_PLANNING },
    ...([1, 2, 3] as const).map((trimestre) => ({
      id: `trim${trimestre}`,
      mode: "trimestral" as const,
      trimestre,
      matriz: trimestralPlans[trimestre]!,
    })),
  ];

  const nextResults: PipelineTabResult[] = [];

  for (const doc of documents) {
    const editorForm =
      doc.mode === "trimestral" && doc.trimestre
        ? {
            ...BASE_FORM,
            tipoPlanejamento: "trimestral" as const,
            trimestre: String(doc.trimestre),
          }
        : { ...BASE_FORM, tipoPlanejamento: "anual" as const };

    const { html } = await resolvePlanningEditorHtml({
      officialPayloadInput: normalizeOfficialPayloadInput({
        tipoPlanejamento: doc.mode,
        escola: BASE_FORM.escola,
        professor: BASE_FORM.professor,
        etapa: BASE_FORM.etapa,
        anoSerie: BASE_FORM.anoSerie,
        areaConhecimento: BASE_FORM.areaConhecimento,
        componenteCurricular: BASE_FORM.componenteCurricular,
        cargaHoraria: BASE_FORM.cargaHoraria,
        trimestre: doc.trimestre ? String(doc.trimestre) : BASE_FORM.trimestre,
        matrizPlanejamento: doc.matriz,
      }),
      fallbackForm: editorForm,
      fallbackPlanning: doc.matriz,
      exportContext: {
        documentType: `planejamento:${doc.mode}`,
        documentId: `plan_e2e_${doc.id}`,
      },
    });

    const marker = detectPlanningHtmlSource(html);
    if (marker !== "official-docx") {
      throw new Error(`Documento ${doc.id} retornou marcador ${marker}`);
    }

    nextResults.push({ id: doc.id, marker });
  }

  return { status: "ok", results: nextResults, error: "" };
}

function getPipelineRunPromise(): Promise<PipelineRunResult> {
  if (!pipelineRunPromise) {
    pipelineRunPromise = runOfficialPlanningPipeline().catch((err) => ({
      status: "error" as const,
      results: [],
      error: err instanceof Error ? err.message : "Erro no pipeline.",
    }));
  }

  return pipelineRunPromise;
}

/** Dispara assim que o bundle carrega (não depende de useEffect / Strict Mode). */
const pipelineReady = getPipelineRunPromise().then((outcome) => {
  if (typeof window !== "undefined") {
    (
      window as Window & {
        __PLANIFY_PIPELINE_RESULT?: PipelineRunResult;
      }
    ).__PLANIFY_PIPELINE_RESULT = outcome;
  }
  return outcome;
});

export default function PlanningOfficialPipelineTestPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [results, setResults] = useState<PipelineTabResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void pipelineReady.then((outcome) => {
      setResults(outcome.results);
      setStatus(outcome.status);
      setError(outcome.error);
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Planning Official Pipeline Test</h1>
        <p className="mt-2 text-sm text-slate-600">
          Resolve anual + 3 trimestrais via pipeline oficial (html-oficial).
        </p>

        <p
          data-testid="planning-pipeline-status"
          className="mt-6 text-sm font-semibold text-slate-800"
        >
          {status}
        </p>

        {error ? (
          <p data-testid="planning-pipeline-error" className="mt-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <ul className="mt-4 space-y-1 text-sm text-slate-700">
          {results.map((item) => (
            <li key={item.id} data-testid={`planning-pipeline-tab-${item.id}`}>
              {item.id}: {item.marker}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
