import { generateGeminiJSON } from "../ai/gemini-client";
import {
  buildPlanningQualityRetryNote,
  getPlanningOutputIssues,
} from "./planning-quality";
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
};

export type PlanningMatrixItem = {
  conteudo: string;
  trimestre: number;
  aulaInicio: number;
  aulaFim: number;
  habilidades: PlanningSkill[];
  objetivos: string;
  metodologia: string;
  recursos: string;
  avaliacao: string;
  evidencias: string;
};

export type PlanningAiResult = {
  success: true;
  usedAI: boolean;
  warning?: string;
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


function expandConteudosForAnnualStandard(conteudos: string[], tipo: "anual" | "trimestral"): string[] {
  if (tipo === "trimestral") {
    return conteudos;
  }

  const safeConteudos = conteudos.length > 0 ? conteudos : ["Conteúdo central"];
  const expanded: string[] = [];
  const focuses = [
    "introdução, contextualização e diagnóstico",
    "desenvolvimento, análise e aplicação orientada",
    "aprofundamento, prática e sistematização",
    "revisão, produção, avaliação e retomada",
  ];

  for (const conteudo of safeConteudos) {
    expanded.push(conteudo);
  }

  let index = 0;

  while (expanded.length < 12) {
    const source = safeConteudos[index % safeConteudos.length];
    const focus = focuses[expanded.length % focuses.length];

    expanded.push(`${source} — ${focus}`);
    index += 1;
  }

  return expanded.slice(0, Math.max(12, safeConteudos.length));
}

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

  const chosen = (byContent.length > 0 ? byContent : skills).slice(0, 3);

  if (chosen.length > 0) {
    return chosen.map((skill) => ({ ...skill, conteudo: content }));
  }

  if (skills.length > 0) {
    return [{ ...skills[0], conteudo: content }];
  }

  return [];
}

function resolveMatrixSkills(
  conteudo: string,
  aiSkills: unknown,
  selectedSkills: PlanningSkill[],
  payload?: PlanningAiPayload,
): PlanningSkill[] {
  if (selectedSkills.length === 0) {
    return skillsForContent(conteudo, [], payload);
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

  const heuristic = skillsForContent(conteudo, selectedSkills, payload).filter(
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
  const safeConteudos = expandConteudosForAnnualStandard(
    conteudos.length > 0 ? conteudos : ["Conteúdo central"],
    tipo,
  );
  const trimestreSelecionado = getTrimestre(payload);
  const carga = parseNumber(payload.cargaHoraria, safeConteudos.length * 10);
  const aulasPorConteudo = 10;
  const chunkSize = Math.max(1, Math.ceil(safeConteudos.length / 3));
  const skills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const matrix = safeConteudos.map((conteudo, index) => {
    const trimestre =
      tipo === "trimestral"
        ? trimestreSelecionado
        : Math.min(3, Math.floor(index / chunkSize) + 1);

    const indexDentroTrimestre =
      tipo === "trimestral" ? index : index - (trimestre - 1) * chunkSize;
    const aulaInicio = indexDentroTrimestre * aulasPorConteudo + 1;
    const aulaFim = (indexDentroTrimestre + 1) * aulasPorConteudo;

    return {
      conteudo,
      trimestre,
      aulaInicio,
      aulaFim,
      habilidades: skillsForContent(conteudo, skills, payload),
      objetivos:
        normalizeText(payload.objetivosGerais || payload.objetivos) ||
        `Compreender, aplicar e sistematizar conhecimentos relacionados a ${conteudo}, desenvolvendo análise, participação, registro e produção conforme a etapa escolar.`,
      metodologia:
        index % 2 === 0
          ? `Aula dialogada, levantamento de conhecimentos prévios, explicação orientada, prática supervisionada, registro e socialização das aprendizagens sobre ${conteudo}.`
          : `Contextualização, análise guiada, atividade em grupo, produção individual, retomada coletiva e síntese do conteúdo ${conteudo}.`,
      recursos:
        index % 2 === 0
          ? "Quadro, caderno, material impresso, textos de apoio, livro didático e recursos digitais disponíveis."
          : "Slides, fichas de atividade, fontes de consulta, projetor, registros do professor e recursos de sala.",
      avaliacao: `Avaliação contínua por participação, registros, resolução das atividades, qualidade das respostas e evidências de aprendizagem sobre ${conteudo}.`,
      evidencias:
        "Registros no caderno, atividades concluídas, respostas orais e escritas, produções individuais ou coletivas e devolutivas do professor.",
    };
  });

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
    return fallbackPlanning(payload, "A IA respondeu sem matriz de conteúdos. Foi usado modo seguro.");
  }

  const tipo = getTipo(payload);
  const selectedSkills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const chunkSize = Math.max(1, Math.ceil(rawItems.length / 3));
  const trimesterCounters = new Map<number, number>();

  const items = rawItems.map((item, index) => {
    const itemRecord = (item || {}) as UnknownRecord;
    const conteudo = normalizeText(
      itemRecord.conteudo || itemRecord.titulo || itemRecord.objetoConhecimento || `Conteúdo ${index + 1}`,
    );
    const trimesterFromAi = Math.min(
      Math.max(parseNumber(itemRecord.trimestre, Math.floor(index / chunkSize) + 1), 1),
      3,
    );
    const trimestre = tipo === "trimestral" ? getTrimestre(payload) : trimesterFromAi;
    const indexDentroTrimestre = trimesterCounters.get(trimestre) || 0;
    trimesterCounters.set(trimestre, indexDentroTrimestre + 1);

    return {
      conteudo,
      trimestre,
      aulaInicio: indexDentroTrimestre * 10 + 1,
      aulaFim: (indexDentroTrimestre + 1) * 10,
      habilidades: resolveMatrixSkills(
        conteudo,
        itemRecord.habilidades,
        selectedSkills,
        payload,
      ),
      objetivos:
        normalizeText(itemRecord.objetivos || itemRecord.objetivo) ||
        `Desenvolver aprendizagens relacionadas a ${conteudo}.`,
      metodologia:
        normalizeText(itemRecord.metodologia || itemRecord.etapas) ||
        `Aula dialogada, prática orientada, registro e socialização sobre ${conteudo}.`,
      recursos:
        normalizeText(itemRecord.recursos) ||
        "Quadro, caderno, material impresso, livro didático e recursos digitais disponíveis.",
      avaliacao:
        normalizeText(itemRecord.avaliacao || itemRecord["avaliação"]) ||
        `Avaliação contínua por participação, registros e evidências de aprendizagem sobre ${conteudo}.`,
      evidencias:
        normalizeText(itemRecord.evidencias || itemRecord["evidências"]) ||
        "Registros, atividades concluídas e devolutivas do professor.",
    };
  });

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
      conteudos: items,
    },
  };
}

const PLANNING_SYSTEM_INSTRUCTION = `
Você é uma IA especialista em planejamento pedagógico brasileiro.
Responda somente com JSON válido, sem markdown nem texto fora do objeto.
Use exclusivamente habilidades BNCC que o professor selecionou — nunca invente códigos genéricos.
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
6. No planejamento anual, distribua os conteúdos entre 1º, 2º e 3º trimestre.
7. No planejamento anual, gere no mínimo 12 linhas: 4 conteúdos/linhas para cada trimestre.
8. Em cada trimestre, reinicie a numeração das aulas: 1 a 10, 11 a 20, 21 a 30, 31 a 40.
9. Cada conteúdo deve ocupar 10 períodos.
10. Gere objetivos/expectativas de aprendizagem, metodologia, recursos, avaliação e evidências.
11. Preencha projetos interdisciplinares, temas integradores e instrumentos de avaliação de forma coerente quando estes campos existirem no DOCX.
12. Não use texto genérico vazio.

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
        "aulaInicio": 1,
        "aulaFim": 10,
        "habilidades": [
          { "codigo": "...", "descricao": "..." }
        ],
        "objetivos": "...",
        "metodologia": "...",
        "recursos": "...",
        "avaliacao": "...",
        "evidencias": "..."
      }
    ]
  }
}
${extraNote ? `\n\n${extraNote}` : ""}
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
    temperature: 0.25,
  });
}

export async function generatePlanningWithAI(
  payload: PlanningAiPayload,
): Promise<PlanningAiResult> {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackPlanning(payload, "Chave de IA não configurada. Foi usado modo seguro.");
  }

  try {
    let json = await requestPlanningJson(payload);
    let result = sanitizeAiResult(json, payload);
    let issues = getPlanningOutputIssues(payload, result.planejamento.conteudos);

    if (issues.length > 0) {
      try {
        const retryJson = await requestPlanningJson(
          payload,
          buildPlanningQualityRetryNote(issues),
        );
        const retryResult = sanitizeAiResult(retryJson, payload);
        const retryIssues = getPlanningOutputIssues(
          payload,
          retryResult.planejamento.conteudos,
        );

        if (retryIssues.length < issues.length || retryIssues.length === 0) {
          result = retryResult;
          issues = retryIssues;
        }
      } catch {
        // Mantém o primeiro resultado se a retentativa falhar.
      }
    }

    if (issues.length > 0) {
      return {
        ...result,
        warning:
          "A matriz foi gerada, mas alguns campos podem precisar de revisão: " +
          issues.join(" "),
      };
    }

    return result;
  } catch (error) {
    return fallbackPlanning(
      payload,
      error instanceof Error
        ? `Erro na geração por IA. Foi usado modo seguro. Detalhe: ${error.message}`
        : "Erro na geração por IA. Foi usado modo seguro.",
    );
  }
}
