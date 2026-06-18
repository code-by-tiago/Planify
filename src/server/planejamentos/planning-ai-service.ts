import { getModelTierForPlanning } from "@/lib/ai/material-generation-policy";
import { GENERATION_SERVER_DEADLINE_MS } from "@/lib/pro/generation-timeout";
import { buildElevateQualityObservacoes } from "@/lib/materiais/material-quality-score";
import {
  assessUnifiedQualityGate,
  UnifiedQualityGateError,
} from "@/lib/materiais/unified-quality-gate";
import { generateGeminiJSON } from "../ai/gemini-client";
import {
  buildSpanishPlanningRules,
  matchBnccSkillsToContent,
} from "./planning-bncc-skills";
import {
  generatePlanningFromBncc as runBnccPlanningEngine,
  runPlanningMatrixEngine,
  assembleTrimestralPackageAsync,
} from "./planning-matrix-engine";
import {
  buildPlanningQualityRetryNote,
  computePlanningQualityScore,
  getPlanningOutputIssues,
} from "./planning-quality";
import {
  finalizeMatrixLessonAllocation,
  parsePlanningCargaHoraria,
} from "./planning-lesson-allocation";
import { splitPlanningConteudos } from "./planning-validation";

type UnknownRecord = Record<string, unknown>;

export type PlanningSkill = {
  codigo: string;
  descricao: string;
  conteudo?: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
};

export type PlanningAiPayload = {
  tipoPlanejamento?: string;
  escola?: string;
  professor?: string;
  etapa?: string;
  anoSerie?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  cargaHoraria?: string | number;
  trimestre?: string | number;
  conteudos?: string | string[];
  objetivosGerais?: string;
  objetivos?: string;
  observacoes?: string;
  habilidadesSelecionadas?: PlanningSkill[];
  elevarQualidade?: boolean;
  problemasQualidade?: string[];
  idempotencyKey?: string;
  idempotency_key?: string;
  classId?: string | null;
  className?: string | null;
  turma?: string | null;
  discipline?: string | null;
  disciplina?: string | null;
  /** Monta a matriz só com conteúdos + habilidades BNCC — sem Gemini e sem cota profunda. */
  modoMatrizBncc?: boolean;
  /** Trimestres a extrair do anual no motor BNCC (1–3). */
  trimestresNoPacote?: number[];
};

export type TrimestralSemanaPlan = {
  semana: 1 | 2 | 3 | 4 | 5;
  microtemas: string[];
  metodologia: string;
  materiais: string;
  etapas: string;
  evidencias: string;
  instrumentos: string;
};

export type PlanningMatrixItem = {
  conteudo: string;
  trimestre: number;
  numeroAula: number;
  periodos: number;
  aulaInicio: number;
  aulaFim: number;
  habilidades: PlanningSkill[];
  objetivos: string;
  metodologia: string;
  materiais?: string;
  recursos: string;
  etapas?: string;
  avaliacao: string;
  evidencias: string;
  /** Preenchido pelo pipeline trimestral (etapas 1–7) antes do DOCX. */
  semanas?: TrimestralSemanaPlan[];
  funcaoAula?: string;
};

export type PlanningAiResult = {
  success: true;
  usedAI: boolean;
  warning?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  package?: import("./planning-matrix-engine").PlanningMatrixPackage;
  planejamento: {
    tipoPlanejamento: string;
    titulo: string;
    resumo: string;
    conteudos: PlanningMatrixItem[];
  };
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}


function normalizeSearch(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const splitConteudos = splitPlanningConteudos;

function parseNumber(value: unknown, fallback: number): number {
  const match = normalizeText(value).match(/\d+/);
  const parsed = match ? Number(match[0]) : NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTipo(payload: PlanningAiPayload): "anual" | "trimestral" {
  const raw = normalizeText(payload.tipoPlanejamento || "anual")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return raw.includes("tri") ? "trimestral" : "anual";
}

function getTrimestre(payload: PlanningAiPayload): number {
  const parsed = parseNumber(payload.trimestre, 1);
  return Math.min(Math.max(parsed, 1), 3);
}

function buildSelectedSkillsIndex(skills: PlanningSkill[]): Map<string, PlanningSkill> {
  const index = new Map<string, PlanningSkill>();

  for (const skill of skills) {
    const codigo = normalizeText(skill.codigo).toUpperCase();

    if (!codigo || codigo === "BNCC") {
      continue;
    }

    index.set(codigo, skill);
  }

  return index;
}

function normalizeSkill(skill: unknown): PlanningSkill {
  const record = (skill || {}) as UnknownRecord;
  const codigo = normalizeText(record.codigo || record["código"] || record.code);
  const descricao = normalizeText(
    record.descricao || record["descrição"] || record.description || record.texto || record.label,
  )
    .replace(codigo, "")
    .replace(/^[-–—:.\s]+/, "")
    .trim();

  return {
    codigo,
    descricao: descricao || "Descrição não informada.",
    conteudo: normalizeText(record.conteudo || record["conteúdo"]),
    etapa: normalizeText(record.etapa),
    anoSerie: normalizeText(record.anoSerie),
    area: normalizeText(record.area),
    componente: normalizeText(record.componente),
  };
}

function skillsForContent(
  content: string,
  skills: PlanningSkill[],
  payload?: PlanningAiPayload,
  contentIndex = 0,
): PlanningSkill[] {
  return matchBnccSkillsToContent(content, skills, payload, contentIndex);
}

function resolveMatrixSkills(
  conteudo: string,
  aiSkills: unknown,
  selectedSkills: PlanningSkill[],
  payload?: PlanningAiPayload,
  contentIndex = 0,
): PlanningSkill[] {
  if (selectedSkills.length === 0) {
    return skillsForContent(conteudo, [], payload, contentIndex);
  }

  const index = buildSelectedSkillsIndex(selectedSkills);
  const fromAi = Array.isArray(aiSkills)
    ? aiSkills
        .map(normalizeSkill)
        .filter((skill) => index.has(skill.codigo.toUpperCase()))
        .map((skill) => ({
          ...index.get(skill.codigo.toUpperCase())!,
          ...skill,
          conteudo,
        }))
    : [];

  if (fromAi.length > 0) {
    return fromAi.slice(0, 3);
  }

  const heuristic = skillsForContent(conteudo, selectedSkills, payload, contentIndex).filter(
    (skill) => index.has(skill.codigo.toUpperCase()),
  );

  if (heuristic.length > 0) {
    return heuristic.slice(0, 3);
  }

  const fallback = selectedSkills[0];
  return fallback ? [{ ...fallback, conteudo }] : [];
}

export { generatePlanningFromBncc } from "./planning-matrix-engine";

function fallbackPlanning(payload: PlanningAiPayload, warning?: string): PlanningAiResult {
  const trimestres = Array.isArray(payload.trimestresNoPacote)
    ? payload.trimestresNoPacote
    : [];
  const result = runPlanningMatrixEngine(payload, {
    trimestres,
    engineMode: "ai-fallback",
    warning,
  });
  const { engineMode: _engineMode, package: _package, ...planningResult } = result;
  return planningResult;
}

function extractJsonFromText(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)?.[1];

  if (fenced) {
    return JSON.parse(fenced);
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first >= 0 && last > first) {
    return JSON.parse(text.slice(first, last + 1));
  }

  return JSON.parse(text);
}

function sanitizeAiResult(value: unknown, payload: PlanningAiPayload): PlanningAiResult {
  const record = (value || {}) as UnknownRecord;
  const planejamento = (record.planejamento || record) as UnknownRecord;
  const rawItems = Array.isArray(planejamento.conteudos)
    ? planejamento.conteudos
    : Array.isArray(record.conteudos)
      ? record.conteudos
      : [];

  if (rawItems.length === 0) {
    throw new Error(
      "A IA não retornou a matriz de conteúdos. Tente gerar novamente em alguns segundos.",
    );
  }

  const tipo = getTipo(payload);
  const selectedSkills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const inputConteudos = splitConteudos(payload.conteudos);
  const chunkSize = Math.max(1, Math.ceil(Math.max(rawItems.length, inputConteudos.length) / 3));

  const items = rawItems.map((item, index) => {
    const itemRecord = (item || {}) as UnknownRecord;
    const conteudo = normalizeText(
      itemRecord.conteudo ||
        itemRecord.titulo ||
        itemRecord.objetoConhecimento ||
        inputConteudos[index] ||
        `Conteúdo ${index + 1}`,
    );
    const trimesterFromAi = Math.min(
      Math.max(parseNumber(itemRecord.trimestre, Math.floor(index / chunkSize) + 1), 1),
      3,
    );
    const trimestre = tipo === "trimestral" ? getTrimestre(payload) : trimesterFromAi;
    const parsedPeriodos = parseNumber(itemRecord.periodos, 0);
    const parsedNumeroAula = parseNumber(itemRecord.numeroAula, index + 1);

    return {
      conteudo,
      trimestre,
      numeroAula: parsedNumeroAula,
      periodos: parsedPeriodos,
      aulaInicio: parseNumber(itemRecord.aulaInicio, 0),
      aulaFim: parseNumber(itemRecord.aulaFim, 0),
      habilidades: resolveMatrixSkills(
        conteudo,
        itemRecord.habilidades,
        selectedSkills,
        payload,
        index,
      ),
      objetivos:
        normalizeText(itemRecord.objetivos || itemRecord.objetivo) ||
        `Desenvolver aprendizagens relacionadas a ${conteudo}.`,
      metodologia:
        normalizeText(itemRecord.metodologia) ||
        `Aula dialogada, prática orientada, registro e socialização sobre ${conteudo}.`,
      materiais:
        normalizeText(itemRecord.materiais) ||
        "Caderno, fichas de atividade, material impresso e textos de apoio.",
      recursos:
        normalizeText(itemRecord.recursos) ||
        "Quadro, livro didático, projetor e recursos digitais disponíveis.",
      etapas:
        normalizeText(itemRecord.etapas) ||
        normalizeText(itemRecord["etapas da experiência"]) ||
        "",
      avaliacao:
        normalizeText(itemRecord.avaliacao || itemRecord["avaliação"]) ||
        `Avaliação contínua por participação, registros e evidências de aprendizagem sobre ${conteudo}.`,
      evidencias:
        normalizeText(itemRecord.evidencias || itemRecord["evidências"]) ||
        "Registros, atividades concluídas e devolutivas do professor.",
    };
  });

  const finalized = finalizeMatrixLessonAllocation(items, payload);

  return {
    success: true,
    usedAI: true,
    planejamento: {
      tipoPlanejamento: tipo,
      titulo:
        normalizeText(planejamento.titulo) ||
        (tipo === "trimestral"
          ? `Planejamento trimestral — ${getTrimestre(payload)}º trimestre`
          : "Planejamento anual"),
      resumo:
        normalizeText(planejamento.resumo) ||
        "Planejamento estruturado pela IA a partir dos conteúdos e habilidades selecionadas.",
      conteudos: finalized,
    },
  };
}

const PLANNING_MAX_ATTEMPTS = 3;

const PLANNING_SYSTEM_INSTRUCTION = `
Você é a IA principal de planejamento pedagógico do Planify — referência em planejamento anual e trimestral alinhado à BNCC.
Responda somente com JSON válido, sem markdown nem texto fora do objeto.
Use exclusivamente habilidades BNCC que o professor selecionou — nunca invente códigos genéricos.
Entregue matriz completa, específica e pronta para o professor usar — não rascunho genérico.
`.trim();

function buildPlanningPrompt(
  payload: PlanningAiPayload,
  extraNote?: string,
): string {
  const tipo = getTipo(payload);
  const conteudos = splitConteudos(payload.conteudos);
  const selectedSkills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const elevateBlock =
    payload.elevarQualidade || payload.problemasQualidade?.length
      ? `\n\n${buildElevateQualityObservacoes(payload.problemasQualidade ?? [])}`
      : "";

  return `
Você é uma IA especialista em planejamento pedagógico brasileiro.

Gere SOMENTE JSON válido, sem markdown.

Dados:
- Tipo: ${tipo}
- Etapa: ${normalizeText(payload.etapa)}
- Ano/Série: ${normalizeText(payload.anoSerie)}
- Área: ${normalizeText(payload.areaConhecimento)}
- Componente: ${normalizeText(payload.componenteCurricular)}
- Carga horária: ${normalizeText(payload.cargaHoraria)}
- Trimestre: ${normalizeText(payload.trimestre)}
- Turma: ${normalizeText(payload.turma || payload.className) || "Não informada"}
- Conteúdos, um por linha:
${conteudos.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Habilidades selecionadas:
${selectedSkills.map((skill) => `- ${skill.codigo} — ${skill.descricao} | conteúdo: ${skill.conteudo || ""}`).join("\n")}

${buildSpanishPlanningRules(payload)}

Regras obrigatórias:
1. Retorne uma matriz em planejamento.conteudos.
2. Cada item deve representar apenas um conteúdo.
3. Cada conteúdo deve ter no máximo 3 habilidades.
4. Use código e descrição completa das habilidades.
5. Não invente código BNCC se houver habilidade selecionada compatível.
6. Gere exatamente uma linha por conteúdo informado pelo professor (na mesma ordem).
7. numeroAula deve ser sequencial: 1 para o 1º conteúdo, 2 para o 2º, e assim por diante.
8. periodos deve variar conforme a complexidade de cada conteúdo (conteúdos densos recebem mais períodos; revisões e introduções recebem menos).
9. A soma de periodos de todas as linhas deve ser igual à carga horária informada (${parsePlanningCargaHoraria(payload.cargaHoraria, conteudos.length)} períodos).
10. No planejamento anual, distribua os conteúdos entre 1º, 2º e 3º trimestre de forma equilibrada.
11. aulaInicio e aulaFim representam a faixa cumulativa de períodos no ano (ou no trimestre, se trimestral).
12. Gere objetivos/expectativas de aprendizagem, metodologia, materiais, recursos necessários, etapas da experiência, evidências de aprendizagem e instrumentos de avaliação.
13. etapas deve listar EXATAMENTE 5 passos numerados (1. a 5.), concretos e progressivos, específicos ao conteúdo da linha.
14. metodologia deve descrever estratégias distintas aplicáveis (grupo, duplas, plenária, produção individual).
15. materiais e recursos: itens separados por vírgula, específicos ao conteúdo (mínimo 4 itens no total).
16. evidencias e avaliacao devem ser observáveis e mensuráveis, ligados às habilidades BNCC da linha.
17. Preencha projetos interdisciplinares, temas integradores de forma coerente quando existirem no DOCX.
18. Não use texto genérico vazio nem repita a mesma metodologia em todas as linhas.
19. Cada linha deve citar estratégias, recursos e avaliação coerentes com o conteúdo daquela linha.
20. Objetivos devem ser mensuráveis e ligados ao componente curricular e à etapa informados.

Formato:
{
  "planejamento": {
    "tipoPlanejamento": "${tipo}",
    "titulo": "...",
    "resumo": "...",
    "conteudos": [
      {
        "conteudo": "...",
        "trimestre": 1,
        "numeroAula": 1,
        "periodos": 5,
        "aulaInicio": 1,
        "aulaFim": 5,
        "habilidades": [
          { "codigo": "...", "descricao": "..." }
        ],
        "objetivos": "...",
        "metodologia": "...",
        "materiais": "...",
        "recursos": "...",
        "etapas": "...",
        "avaliacao": "...",
        "evidencias": "..."
      }
    ]
  }
}
${elevateBlock}${extraNote ? `\n\n${extraNote}` : ""}
`.trim();
}

async function requestPlanningJson(
  payload: PlanningAiPayload,
  extraNote?: string,
): Promise<unknown> {
  const prompt = buildPlanningPrompt(payload, extraNote);

  return generateGeminiJSON<unknown>({
    systemInstruction: PLANNING_SYSTEM_INSTRUCTION,
    prompt,
    cacheProfile: "planning-matrix",
    tier: getModelTierForPlanning({
      elevarQualidade: payload.elevarQualidade,
      problemasQualidade: payload.problemasQualidade,
      observacoes: payload.observacoes,
    }),
    temperature: 0.18,
    topP: 0.78,
    maxOutputTokens: 24000,
  });
}

export async function generatePlanningWithAI(
  payload: PlanningAiPayload,
  options?: { userId?: string | null },
): Promise<PlanningAiResult> {
  if (payload.modoMatrizBncc === true) {
    const trimestres = Array.isArray(payload.trimestresNoPacote)
      ? payload.trimestresNoPacote
      : [];
    const result = runBnccPlanningEngine(payload, trimestres);
    const { engineMode: _engineMode, ...planningResult } = result;
    return planningResult;
  }

  if (!process.env.GEMINI_API_KEY) {
    return fallbackPlanning(payload, "Chave de IA não configurada. Foi usado modo seguro.");
  }

  const { enrichWithPedagogicalContext } = await import(
    "@/server/pedagogical-cache/enrich-with-pedagogical-context"
  );
  const conteudosList = splitConteudos(payload.conteudos);
  const enrichedPayload = await enrichWithPedagogicalContext(
    payload,
    {
      tema: conteudosList[0] || "",
      componenteCurricular: payload.componenteCurricular,
      etapa: payload.etapa,
      anoSerie: payload.anoSerie,
      habilidadesSelecionadas: payload.habilidadesSelecionadas,
    },
    {
      userId: options?.userId ?? null,
      toolTipo: "planejamento",
      allowScrape: true,
    },
  );

  try {
  let retryNote = "";
  const planningStartedAt = Date.now();
  const isPastPlanningDeadline = () =>
    Date.now() - planningStartedAt > GENERATION_SERVER_DEADLINE_MS;

  for (let attempt = 0; attempt < PLANNING_MAX_ATTEMPTS; attempt += 1) {
    const json = await requestPlanningJson(
      enrichedPayload,
      retryNote || undefined,
    );
    const result = sanitizeAiResult(json, enrichedPayload);
    const issues = getPlanningOutputIssues(
      enrichedPayload,
      result.planejamento.conteudos,
    );

    if (!issues.length) {
      const tipo = getTipo(enrichedPayload);
      const trimestres = Array.isArray(enrichedPayload.trimestresNoPacote)
        ? enrichedPayload.trimestresNoPacote
        : [];

      let packageResult;
      if (tipo === "anual" && trimestres.length > 0 && result.usedAI) {
        packageResult = await assembleTrimestralPackageAsync(
          result.planejamento,
          trimestres,
          {
            cargaHoraria: String(enrichedPayload.cargaHoraria ?? ""),
            componenteCurricular: String(
              enrichedPayload.componenteCurricular ||
                enrichedPayload.disciplina ||
                enrichedPayload.discipline ||
                "",
            ),
            etapa: String(enrichedPayload.etapa ?? ""),
            anoSerie: String(enrichedPayload.anoSerie ?? ""),
            elevarQualidade: enrichedPayload.elevarQualidade === true,
            useAiExpansion: true,
          },
        );
      }

      return {
        ...result,
        qualityScore: computePlanningQualityScore([]),
        qualityIssues: [],
        package: packageResult,
      };
    }

    if (attempt === PLANNING_MAX_ATTEMPTS - 1 || isPastPlanningDeadline()) {
      const qualityScore = computePlanningQualityScore(issues);
      const gate = assessUnifiedQualityGate({
        qualityScore,
        qualityIssues: issues,
      });
      if (!gate.pass) {
        throw new UnifiedQualityGateError(gate);
      }
      return {
        ...result,
        qualityScore,
        qualityIssues: issues,
      };
    }

    retryNote = buildPlanningQualityRetryNote(issues);
  }

  throw new Error("Não foi possível gerar o planejamento com a qualidade esperada.");
  } catch (error) {
    if (error instanceof UnifiedQualityGateError) {
      throw error;
    }
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível gerar o planejamento com IA.";
    return fallbackPlanning(payload, message);
  }
}
