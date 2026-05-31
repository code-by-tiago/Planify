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

function splitConteudos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitConteudos(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return normalizeText(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}


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

function normalizeSkill(skill: unknown): PlanningSkill {
  const record = (skill || {}) as UnknownRecord;
  const codigo = normalizeText(record.codigo || record["código"] || record.code || "BNCC");
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

function skillsForContent(content: string, skills: PlanningSkill[]): PlanningSkill[] {
  const normalized = content
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const byContent = skills.filter((skill) => {
    const skillContent = normalizeText(skill.conteudo)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    return (
      skillContent &&
      (skillContent.includes(normalized) || normalized.includes(skillContent))
    );
  });

  const chosen = (byContent.length > 0 ? byContent : skills).slice(0, 3);

  return chosen.length > 0
    ? chosen
    : [
        {
          codigo: "BNCC",
          descricao:
            "Habilidade a ser confirmada pelo professor conforme conteúdo, etapa e componente.",
          conteudo: content,
        },
      ];
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
      habilidades: skillsForContent(conteudo, skills),
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
      habilidades: Array.isArray(itemRecord.habilidades)
        ? itemRecord.habilidades.map(normalizeSkill).slice(0, 3)
        : skillsForContent(conteudo, selectedSkills),
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

export async function generatePlanningWithAI(
  payload: PlanningAiPayload,
): Promise<PlanningAiResult> {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return fallbackPlanning(payload, "Chave de IA não configurada. Foi usado modo seguro.");
  }

  const tipo = getTipo(payload);
  const conteudos = splitConteudos(payload.conteudos);
  const selectedSkills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const prompt = `
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
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return fallbackPlanning(
        payload,
        `A IA não respondeu corretamente. Foi usado modo seguro. Detalhe: ${errorText.slice(0, 180)}`,
      );
    }

    const data = await response.json();
    const text = normalizeText(
      data?.candidates?.[0]?.content?.parts?.map((part: UnknownRecord) => part.text).join("\n"),
    );

    const json = extractJsonFromText(text);
    return sanitizeAiResult(json, payload);
  } catch (error) {
    return fallbackPlanning(
      payload,
      error instanceof Error
        ? `Erro na geração por IA. Foi usado modo seguro. Detalhe: ${error.message}`
        : "Erro na geração por IA. Foi usado modo seguro.",
    );
  }
}
