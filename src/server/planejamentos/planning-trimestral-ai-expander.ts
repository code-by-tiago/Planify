import { generateGeminiJSON } from "@/server/ai/gemini-client";
import { getModelTierForPlanning } from "@/lib/ai/material-generation-policy";
import { resolveWeeklyPeriodsFromPayload } from "@/lib/planejamentos/planning-annual-field-enrichment";
import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";
import type { TrimestralAulaPlan, TrimestralSemanaPlan } from "@/lib/planejamentos/planning-trimestral-types";
import { validateTrimestralAulaPlans } from "@/lib/planejamentos/planning-trimestral-pedagogical-validator";
import { deduplicateWeekFields } from "@/lib/planejamentos/planning-trimestral-similarity";
import {
  deriveExpectativaAprendizagem,
  enrichObjetoConhecimento,
  enrichUnidadeTematica,
  formatHabilidadesBnccAnual,
} from "@/lib/planejamentos/planning-annual-field-enrichment";

const TRIMESTRAL_EXPANDER_SYSTEM = `
Você é coordenador pedagógico experiente da rede pública brasileira, especialista em planejamento trimestral alinhado à BNCC (Matriz de Referência RS).
Responda SOMENTE com JSON válido, sem markdown.
Nunca use placeholders como [descreva...] ou "de acordo com o planejamento".
Todo texto deve ser final, profissional e pronto para inserir no documento oficial.
Use EXCLUSIVAMENTE conteúdos e habilidades BNCC fornecidos no anual — não invente códigos novos.
`.trim();

type AiSemanaOutput = {
  semana: number;
  metodologia?: string;
  materiais?: string;
  etapas?: string;
  evidencias?: string;
  instrumentos?: string;
};

type AiAulaOutput = {
  numeroAula?: number;
  funcaoAula?: string;
  projetos?: string;
  semanas?: AiSemanaOutput[];
};

type AiTrimestralOutput = {
  aulas?: AiAulaOutput[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function resolveActiveWeekCount(item: PlanningMatrixItem, weeklyPeriods: number): number {
  const periodos = Math.max(1, Number(item.periodos) || 1);
  const weeksFromPeriodos =
    weeklyPeriods > 0 ? Math.max(1, Math.ceil(periodos / weeklyPeriods)) : periodos;
  return Math.min(5, Math.max(1, weeksFromPeriodos));
}

function buildExpanderPrompt(
  items: PlanningMatrixItem[],
  trimestre: number,
  context: {
    componenteCurricular?: string;
    etapa?: string;
    anoSerie?: string;
    cargaHoraria?: string;
    weeklyPeriods: number;
  },
): string {
  const anualJson = items.map((item) => ({
    conteudo: item.conteudo,
    periodos: item.periodos,
    semanasAtivas: resolveActiveWeekCount(item, context.weeklyPeriods),
    habilidades: item.habilidades.map((h) => ({ codigo: h.codigo, descricao: h.descricao })),
    objetivos: item.objetivos,
    metodologia: item.metodologia,
    materiais: item.materiais,
    recursos: item.recursos,
    etapas: item.etapas,
    evidencias: item.evidencias,
    avaliacao: item.avaliacao,
  }));

  return `
Expanda o planejamento ANUAL abaixo para o ${trimestre}º TRIMESTRE no formato de experiências de aprendizagem (semanas 1 a 5).

CONTEXTO:
- Componente: ${normalizeText(context.componenteCurricular)}
- Etapa: ${normalizeText(context.etapa)}
- Ano/Série: ${normalizeText(context.anoSerie)}
- Carga horária: ${normalizeText(context.cargaHoraria)}
- Períodos por semana (referência): ${context.weeklyPeriods}

PLANEJAMENTO ANUAL (fonte obrigatória — não altere conteúdos nem habilidades):
${JSON.stringify(anualJson, null, 2)}

REGRAS OBRIGATÓRIAS:
1. Não crie planejamento novo: expanda fielmente o anual do trimestre.
2. Não invente habilidades BNCC fora das listadas.
3. Para cada aula, preencha apenas as semanas indicadas em semanasAtivas; deixe vazias as demais (não inclua semanas extras).
4. Cada semana ativa deve ter metodologia, materiais, etapas, evidências e instrumentos DISTINTOS.
5. Semana 1 ≠ Semana 2 ≠ Semana 3 ≠ Semana 4 ≠ Semana 5 (quando ativas).
6. Aula 1 ≠ Aula 2 ≠ Aula 3... (funções pedagógicas diferentes).
7. Metodologia: descreva organização da turma naquele encontro (grupo, duplas, individual, plenária).
8. Materiais: liste o necessário para aquele encontro (derivado do anual).
9. Etapas: atividades concretas com início, desenvolvimento e fechamento.
10. Evidências: o que observar na atividade para identificar aprendizagem.
11. Instrumentos: como coletar evidências naquela semana.
12. Progressão: acolhimento → problematização → prática → síntese → avaliação formativa.
13. Linguagem de professor experiente, objetiva, sem repetição de frases entre semanas.

FORMATO JSON:
{
  "aulas": [
    {
      "numeroAula": 1,
      "funcaoAula": "introdução | desenvolvimento | prática | aprofundamento | revisão",
      "projetos": "texto de projetos interdisciplinares desta aula",
      "semanas": [
        {
          "semana": 1,
          "metodologia": "...",
          "materiais": "...",
          "etapas": "1. ...",
          "evidencias": "...",
          "instrumentos": "..."
        }
      ]
    }
  ]
}
`.trim();
}

function mapAiAulaToPlan(
  item: PlanningMatrixItem,
  aiAula: AiAulaOutput | undefined,
  aulaIndex: number,
  component: string,
  activeWeeks: number,
): TrimestralAulaPlan {
  const semanas: TrimestralSemanaPlan[] = Array.from({ length: 5 }, (_, index) => {
    const semanaNum = (index + 1) as TrimestralSemanaPlan["semana"];
    const aiSemana = aiAula?.semanas?.find((s) => Number(s.semana) === semanaNum);

    if (index >= activeWeeks || !aiSemana) {
      return {
        semana: semanaNum,
        microtemas: [],
        metodologia: "",
        materiais: "",
        etapas: "",
        evidencias: "",
        instrumentos: "",
      };
    }

    return {
      semana: semanaNum,
      microtemas: [normalizeText(aiSemana.etapas).replace(/^\d+\.\s*/, "")].filter(Boolean),
      metodologia: normalizeText(aiSemana.metodologia),
      materiais: normalizeText(aiSemana.materiais),
      etapas: normalizeText(aiSemana.etapas),
      evidencias: normalizeText(aiSemana.evidencias),
      instrumentos: normalizeText(aiSemana.instrumentos),
    };
  });

  return {
    itemAnual: item,
    funcaoAula: normalizeText(aiAula?.funcaoAula) || "desenvolvimento",
    unidadeTematica: enrichUnidadeTematica(item.conteudo, component, item.habilidades || []),
    objetoConhecimento: enrichObjetoConhecimento(item.conteudo, item.habilidades || []),
    habilidades: formatHabilidadesBnccAnual(item.habilidades || []),
    expectativas: deriveExpectativaAprendizagem(item.conteudo, item.habilidades || []),
    projetos:
      normalizeText(aiAula?.projetos) ||
      `Atividades integradoras sobre ${item.conteudo}: leitura, pesquisa, produção e socialização.`,
    semanas,
  };
}

export async function expandTrimestralAulasWithAI(
  items: PlanningMatrixItem[],
  trimestre: number,
  options?: {
    cargaHoraria?: string;
    componenteCurricular?: string;
    etapa?: string;
    anoSerie?: string;
    elevarQualidade?: boolean;
  },
): Promise<TrimestralAulaPlan[] | null> {
  if (!process.env.GEMINI_API_KEY || items.length === 0) {
    return null;
  }

  const weeklyPeriods = resolveWeeklyPeriodsFromPayload(options?.cargaHoraria ?? "");
  const component = options?.componenteCurricular ?? "";

  try {
    const raw = await generateGeminiJSON<AiTrimestralOutput>({
      systemInstruction: TRIMESTRAL_EXPANDER_SYSTEM,
      prompt: buildExpanderPrompt(items, trimestre, {
        componenteCurricular: component,
        etapa: options?.etapa,
        anoSerie: options?.anoSerie,
        cargaHoraria: options?.cargaHoraria,
        weeklyPeriods,
      }),
      tier: getModelTierForPlanning({
        elevarQualidade: options?.elevarQualidade,
      }),
      temperature: 0.22,
      topP: 0.82,
      maxOutputTokens: 16000,
    });

    const aiAulas = Array.isArray(raw?.aulas) ? raw.aulas : [];

    const aulas = items.map((item, index) => {
      const aiAula =
        aiAulas.find((a) => Number(a.numeroAula) === index + 1) ?? aiAulas[index];
      const activeWeeks = resolveActiveWeekCount(item, weeklyPeriods);
      return mapAiAulaToPlan(item, aiAula, index, component, activeWeeks);
    });

    const validation = validateTrimestralAulaPlans(aulas);
    if (!validation.ok) {
      return null;
    }

    const { aulas: deduped } = deduplicateWeekFields(aulas);
    return deduped;
  } catch {
    return null;
  }
}
