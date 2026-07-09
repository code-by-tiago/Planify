import { getModelTierForPlanning } from "@/lib/ai/material-generation-policy";
import { GENERATION_SERVER_DEADLINE_MS } from "@/lib/pro/generation-timeout";
import { buildElevateQualityObservacoes } from "@/lib/materiais/material-quality-score";
import {
  assessUnifiedQualityGate,
  UnifiedQualityGateError,
} from "@/lib/materiais/unified-quality-gate";
import { generateGeminiJSON } from "../ai/gemini-client";
import { PLANNING_PEDAGOGICAL_VOICE } from "../ai/prompts/planify-pedagogical-dna";
import {
  buildPlanningQualityRetryNote,
  computePlanningQualityScore,
  getPlanningOutputIssues,
} from "./planning-quality";
import {
  finalizeMatrixLessonAllocation,
  parsePlanningCargaHoraria,
  parsePlanningCargaHorariaStrict,
} from "./planning-lesson-allocation";
import { splitPlanningConteudos } from "./planning-validation";
import { PLANNING_RESPONSE_SCHEMA } from "./planning-response-schema";

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
  annualContext?: string;
  parentAnnualKey?: string;
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
};

export type PlanningAiResult = {
  success: true;
  usedAI: boolean;
  warning?: string;
  qualityScore?: number;
  qualityIssues?: string[];
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

const SPANISH_EM_PLANNING_SKILLS: PlanningSkill[] = [
  {
    codigo: "EM13LGG102",
    descricao:
      "Analisar visões de mundo, conflitos de interesse, preconceitos e ideologias presentes nos discursos veiculados nas diferentes mídias, ampliando suas possibilidades de explicação, interpretação e intervenção crítica da/na realidade.",
    componente: "Língua Espanhola",
    area: "Linguagens e suas Tecnologias",
    etapa: "Ensino Médio",
    anoSerie: "1ª a 3ª série",
  },
  {
    codigo: "EM13LGG301",
    descricao:
      "Participar de processos de produção individual e colaborativa em diferentes linguagens (artísticas, corporais e verbais), levando em conta suas formas e seus funcionamentos, para produzir sentidos em diferentes contextos.",
    componente: "Língua Espanhola",
    area: "Linguagens e suas Tecnologias",
    etapa: "Ensino Médio",
    anoSerie: "1ª a 3ª série",
  },
  {
    codigo: "EM13LGG401",
    descricao:
      "Analisar criticamente textos de modo a compreender e caracterizar as línguas como fenômeno (geo)político, histórico, social, cultural, variável, heterogêneo e sensível aos contextos de uso.",
    componente: "Língua Espanhola",
    area: "Linguagens e suas Tecnologias",
    etapa: "Ensino Médio",
    anoSerie: "1ª a 3ª série",
  },
];

function isSpanishHighSchoolPayload(payload?: PlanningAiPayload): boolean {
  if (!payload) {
    return false;
  }

  const component = normalizeSearch(payload.componenteCurricular);
  const stage = normalizeSearch(`${payload.etapa || ""} ${payload.anoSerie || ""}`);

  const isSpanish =
    component.includes("lingua espanhola") ||
    component.includes("espanhol") ||
    component.includes("espanola") ||
    component.includes("lengua espanola");
  const isHighSchool =
    stage.includes("ensino medio") ||
    stage.includes("medio") ||
    stage.includes("1 serie") ||
    stage.includes("1a serie") ||
    stage.includes("1ª serie") ||
    stage.includes("2 serie") ||
    stage.includes("2a serie") ||
    stage.includes("2ª serie") ||
    stage.includes("3 serie") ||
    stage.includes("3a serie") ||
    stage.includes("3ª serie");

  return isSpanish && isHighSchool;
}

function spanishHighSchoolSkillCodesForContent(content: string): string[] {
  const normalized = normalizeSearch(content);
  const codes: string[] = [];

  if (/gramatic|gramatica|verbo|verbos|conjug|tempo verbal|presente|preterito|pretérito|futuro|imperativo|subjuntivo|ser\b|estar\b|tener\b|haber\b|gustar|pronome|pronombres|artigo|articulos|artículo|substantivo|sustantivo|adjetivo|adverbio|preposi|conect|vocab|vocabulario|vocabulário|lexico|léxico|numerais|numeros|alfabeto|pronuncia|fonetica|fonética/.test(normalized)) {
    codes.push("EM13LGG102");
  }

  if (/leitura|leer|lectura|interpret|compreens|comprension|compreensão|texto|textos|escrita|escribir|redacao|redação|producao textual|produção textual|oralidade|oral|fala|escuta|dialogo|diálogo|conversa|entrevista|genero textual|gênero textual|carta|email|e-mail|noticia|notícia|resenha|relato|roteiro|argument|opiniao|opinião/.test(normalized)) {
    codes.push("EM13LGG301");
  }

  if (/cultura|cultural|hispan|hispânico|hispanico|hispano|paises|países|pais|país|america latina|américa latina|latino|espanha|mexico|méxico|argentina|uruguai|paraguai|chile|colombia|colômbia|peru|bolivia|bolívia|literatura|literario|literário|poesia|poema|conto|romance|autor|autores|obra|obras|diversidade|identidade|festividade|celebracao|celebração|dia de los muertos|mundo global|global|variedade|variacao|variação|sotaque|dialeto/.test(normalized)) {
    codes.push("EM13LGG401");
  }

  return Array.from(new Set(codes.length > 0 ? codes : ["EM13LGG401"])).slice(0, 2);
}

function buildSpanishPlanningRules(payload: PlanningAiPayload): string {
  if (!isSpanishHighSchoolPayload(payload)) {
    return "";
  }

  return `
REGRAS ESPECÍFICAS PARA LÍNGUA ESPANHOLA NO ENSINO MÉDIO:
- A BNCC não possui código específico de Língua Espanhola no Ensino Médio.
- Use somente habilidades EM13LGG da área de Linguagens e suas Tecnologias já selecionadas.
- Não repita automaticamente as mesmas 3 habilidades em todos os conteúdos.
- Cada conteúdo deve receber no máximo 1 ou 2 habilidades.
- Gramática, verbos e vocabulário: priorize EM13LGG102.
- Leitura, interpretação, oralidade e escrita: priorize EM13LGG301.
- Cultura hispânica, literatura, países, diversidade e variação linguística: priorize EM13LGG401.
`.trim();
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
  if (isSpanishHighSchoolPayload(payload)) {
    const codes = spanishHighSchoolSkillCodesForContent(content);
    const sourceSkills = skills.length > 0 ? skills : SPANISH_EM_PLANNING_SKILLS;
    const selected = codes
      .map((code) =>
        sourceSkills.find((skill) => skill.codigo.toUpperCase() === code) ||
        SPANISH_EM_PLANNING_SKILLS.find((skill) => skill.codigo === code),
      )
      .filter((skill): skill is PlanningSkill => Boolean(skill))
      .map((skill) => ({ ...skill, conteudo: content }));

    if (selected.length > 0) {
      return selected.slice(0, 2);
    }
  }

  const normalized = normalizeSearch(content);

  const byContent = skills.filter((skill) => {
    const skillContent = normalizeSearch(skill.conteudo);

    return (
      skillContent &&
      (skillContent.includes(normalized) || normalized.includes(skillContent))
    );
  });

  if (byContent.length > 0) {
    return byContent.slice(0, 2).map((skill) => ({ ...skill, conteudo: content }));
  }

  if (skills.length === 0) {
    return [];
  }

  const perContent = 2;
  const distributed: PlanningSkill[] = [];
  const seen = new Set<string>();

  for (let offset = 0; offset < skills.length && distributed.length < perContent; offset += 1) {
    const skill = skills[(contentIndex * perContent + offset) % skills.length];
    const key = normalizeSearch(skill.codigo || skill.descricao || "");

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    distributed.push({ ...skill, conteudo: content });
  }

  if (distributed.length > 0) {
    return distributed;
  }

  return [{ ...skills[contentIndex % skills.length], conteudo: content }];
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

function fallbackPlanning(payload: PlanningAiPayload, warning?: string): PlanningAiResult {
  const conteudos = splitConteudos(payload.conteudos);
  const tipo = getTipo(payload);
  const safeConteudos = conteudos.length > 0 ? conteudos : ["Conteúdo central"];
  const trimestreSelecionado = getTrimestre(payload);
  const chunkSize = Math.max(1, Math.ceil(safeConteudos.length / 3));
  const skills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const draftMatrix = safeConteudos.map((conteudo, index) => {
    const trimestre =
      tipo === "trimestral"
        ? trimestreSelecionado
        : Math.min(3, Math.floor(index / chunkSize) + 1);

    return {
      conteudo,
      trimestre,
      numeroAula: index + 1,
      periodos: 0,
      aulaInicio: 0,
      aulaFim: 0,
      habilidades: skillsForContent(conteudo, skills, payload, index),
      objetivos:
        normalizeText(payload.objetivosGerais || payload.objetivos) ||
        `Compreender, aplicar e sistematizar conhecimentos relacionados a ${conteudo}, desenvolvendo análise, participação, registro e produção conforme a etapa escolar.`,
      metodologia:
        index % 2 === 0
          ? `Aula dialogada, levantamento de conhecimentos prévios, explicação orientada, prática supervisionada, registro e socialização das aprendizagens sobre ${conteudo}.`
          : `Contextualização, análise guiada, atividade em grupo, produção individual, retomada coletiva e síntese do conteúdo ${conteudo}.`,
      materiais: "Caderno, fichas de atividade, material impresso e textos de apoio.",
      recursos:
        index % 2 === 0
          ? "Quadro, livro didático, projetor e recursos digitais disponíveis."
          : "Quadro, slides, fontes de consulta, projetor e registros do professor.",
      etapas:
        index % 2 === 0
          ? "1. Contextualização do tema.\n2. Explicação e prática orientada.\n3. Registro e socialização."
          : "1. Mobilização de conhecimentos prévios.\n2. Atividade em grupo e produção individual.\n3. Síntese e devolutiva.",
      avaliacao: `Avaliação contínua por participação, registros, resolução das atividades, qualidade das respostas e evidências de aprendizagem sobre ${conteudo}.`,
      evidencias:
        "Registros no caderno, atividades concluídas, respostas orais e escritas, produções individuais ou coletivas e devolutivas do professor.",
    };
  });

  const matrix = finalizeMatrixLessonAllocation(draftMatrix, payload);

  return {
    success: true,
    usedAI: false,
    warning,
    planejamento: {
      tipoPlanejamento: tipo,
      titulo:
        tipo === "trimestral"
          ? `Planejamento trimestral — ${trimestreSelecionado}º trimestre`
          : "Planejamento anual",
      resumo:
        "Planejamento estruturado em modo seguro a partir dos conteúdos, habilidades selecionadas e dados pedagógicos informados.",
      conteudos: matrix,
    },
  };
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
  const cargaHoraria =
    parsePlanningCargaHorariaStrict(payload.cargaHoraria) ??
    parsePlanningCargaHoraria(payload.cargaHoraria, conteudos.length);

  const elevateBlock =
    payload.elevarQualidade || payload.problemasQualidade?.length
      ? `\n\n${buildElevateQualityObservacoes(payload.problemasQualidade ?? [])}`
      : "";

  return `
${PLANNING_PEDAGOGICAL_VOICE}

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

${normalizeText(payload.annualContext) ? `${normalizeText(payload.annualContext)}\n` : ""}
Regras obrigatórias:
1. Retorne uma matriz em planejamento.conteudos.
2. Cada linha representa UMA aula para UM conteúdo informado pelo professor.
3. A matriz deve ter exatamente ${Math.max(1, conteudos.length)} linha(s): uma linha para cada conteúdo informado, na mesma ordem.
4. Cada conteúdo deve ter no máximo 3 habilidades.
5. Use código e descrição completa das habilidades.
6. Não invente código BNCC se houver habilidade selecionada compatível.
7. Mantenha a ordem dos conteúdos informados.
8. NUNCA repita o mesmo conteúdo para completar carga horária.
9. Não crie "parte 1", "parte 2", "continuação" ou linhas adicionais do mesmo conteúdo.
10. numeroAula deve ser sequencial por trimestre: 1, 2, 3… dentro de cada trimestre.
11. periodos deve variar por linha (tipicamente 1 a 10); a SOMA de todos os periodos deve ser exatamente ${cargaHoraria}.
12. aulaInicio e aulaFim representam a faixa acumulada de períodos dentro do trimestre (ex.: periodos=5 com início em 6 → aulaInicio=6, aulaFim=10).
13. No planejamento anual, distribua os conteúdos entre 1º, 2º e 3º trimestre de forma equilibrada.
15. Gere objetivos/expectativas de aprendizagem, metodologia, materiais, recursos necessários, etapas da experiência, evidências de aprendizagem e instrumentos de avaliação.
16. Preencha projetos interdisciplinares, temas integradores e instrumentos de avaliação de forma coerente quando estes campos existirem no DOCX.
17. Não use texto genérico vazio nem repita a mesma metodologia em todas as linhas.
18. Cada linha deve citar estratégias, recursos e avaliação coerentes com o conteúdo daquela linha.
19. Objetivos devem ser mensuráveis e ligados ao componente curricular e à etapa informados.

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
      },
      {
        "conteudo": "...",
        "trimestre": 1,
        "numeroAula": 2,
        "periodos": 4,
        "aulaInicio": 6,
        "aulaFim": 9,
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
    responseSchema: PLANNING_RESPONSE_SCHEMA,
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
      return {
        ...result,
        qualityScore: computePlanningQualityScore([]),
        qualityIssues: [],
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
