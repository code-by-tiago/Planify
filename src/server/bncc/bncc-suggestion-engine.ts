import fs from "node:fs";
import path from "node:path";

type UnknownRecord = Record<string, unknown>;

export type BnccSkillSuggestion = {
  id: string;
  codigo: string;
  descricao: string;
  texto: string;
  label: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo: string;
  score: number;
  source: "local" | "fallback";
};

export type BnccSuggestionPayload = {
  etapa?: string;
  anoSerie?: string;
  serie?: string;
  ano?: string;
  areaConhecimento?: string;
  area?: string;
  componenteCurricular?: string;
  componente?: string;
  conteudos?: string | string[];
  conteudo?: string;
  contents?: string[];
  temaCentral?: string;
  tema?: string;
};

type SkillCandidate = {
  codigo: string;
  descricao: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  rawText: string;
  source: "local" | "fallback";
};

const STOP_WORDS = new Set([
  "para",
  "com",
  "sem",
  "dos",
  "das",
  "uma",
  "por",
  "que",
  "nas",
  "nos",
  "aos",
  "aulas",
  "aula",
  "conteudo",
  "conteudos",
  "tema",
  "central",
  "uso",
  "sobre",
  "como",
  "entre",
  "pela",
  "pelo",
  "suas",
  "seus",
  "sua",
  "seu",
  "de",
  "do",
  "da",
  "e",
  "o",
  "a",
  "os",
  "as",
  "em",
  "no",
  "na",
]);

const FALLBACK_SKILLS: SkillCandidate[] = [
  {
    codigo: "EM13LGG101",
    descricao:
      "Compreender e analisar processos de produção e circulação de discursos, nas diferentes linguagens, para fazer escolhas fundamentadas em função de interesses pessoais e coletivos.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "discursos linguagens produção circulação escolhas fundamentadas texto gêneros argumentação",
    source: "fallback",
  },
  {
    codigo: "EM13LGG102",
    descricao:
      "Analisar visões de mundo, conflitos de interesse, preconceitos e ideologias presentes nos discursos veiculados nas diferentes mídias.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "discurso mídia repertório sociocultural ideologia argumento ponto de vista dados fontes",
    source: "fallback",
  },
  {
    codigo: "EM13LP05",
    descricao:
      "Analisar, em textos argumentativos, os posicionamentos assumidos, os movimentos argumentativos e os argumentos utilizados para sustentá-los.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "texto argumentativo dissertação tese argumento repertório sociocultural proposta intervenção enunciado",
    source: "fallback",
  },
  {
    codigo: "EM13LP06",
    descricao:
      "Analisar efeitos de sentido decorrentes de escolhas linguísticas, recursos expressivos, coesão, coerência e adequação ao contexto de produção.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "norma padrão coesão coerência linguagem registro texto produção escrita gramática",
    source: "fallback",
  },
  {
    codigo: "EF69LP07",
    descricao:
      "Produzir textos em diferentes gêneros, considerando sua adequação ao contexto de produção, circulação e recepção.",
    etapa: "Ensino Fundamental",
    componente: "Língua Portuguesa",
    rawText:
      "produção textual gênero texto contexto escrita planejamento revisão circulação recepção",
    source: "fallback",
  },
  {
    codigo: "EF69LP08",
    descricao:
      "Revisar e editar textos, considerando coesão, coerência, ortografia, pontuação e adequação ao gênero proposto.",
    etapa: "Ensino Fundamental",
    componente: "Língua Portuguesa",
    rawText:
      "revisão textual coesão coerência ortografia pontuação norma padrão edição escrita",
    source: "fallback",
  },
  {
    codigo: "EF05HI01",
    descricao:
      "Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.",
    etapa: "Ensino Fundamental",
    componente: "História",
    rawText:
      "povos culturas formação sociedade território brasil história memória diversidade",
    source: "fallback",
  },
  {
    codigo: "EF05HI02",
    descricao:
      "Identificar os mecanismos de organização do poder político com vistas à compreensão da ideia de Estado.",
    etapa: "Ensino Fundamental",
    componente: "História",
    rawText:
      "estado poder político organização sociedade história brasil colonização",
    source: "fallback",
  },
];

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
    .replace(/\p{Diacritic}/gu, "");
}

function getRecordValue(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && normalizeText(value)) {
      return value;
    }
  }

  return "";
}

function getString(payload: BnccSuggestionPayload, keys: string[], fallback = ""): string {
  const source = payload as UnknownRecord;
  const value = getRecordValue(source, keys);

  return normalizeText(value) || fallback;
}

function splitContents(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitContents(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return normalizeText(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractConteudosFromPayload(payload: BnccSuggestionPayload): string[] {
  const byConteudos = splitContents(payload.conteudos);

  if (byConteudos.length > 0) {
    return byConteudos;
  }

  const byConteudo = splitContents(payload.conteudo);

  if (byConteudo.length > 0) {
    return byConteudo;
  }

  const byContents = splitContents(payload.contents);

  if (byContents.length > 0) {
    return byContents;
  }

  const theme = getString(payload, ["temaCentral", "tema"]);

  return theme ? [theme] : [];
}

function looksLikeSkill(record: UnknownRecord): boolean {
  return Boolean(
    record.codigo ||
      record["código"] ||
      record.code ||
      record.habilidade ||
      record.habilidade_codigo ||
      record.descricao ||
      record["descrição"] ||
      record.description ||
      record.texto,
  );
}

function flatten(value: unknown, limit = 20000): unknown[] {
  const output: unknown[] = [];
  const stack: unknown[] = [value];

  while (stack.length > 0 && output.length < limit) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        stack.push(item);
      }

      continue;
    }

    if (typeof current === "object") {
      const record = current as UnknownRecord;

      if (looksLikeSkill(record)) {
        output.push(record);
        continue;
      }

      for (const item of Object.values(record)) {
        stack.push(item);
      }

      continue;
    }

    if (typeof current === "string" && current.length > 8) {
      output.push(current);
    }
  }

  return output;
}

function parseSkillCode(text: string): string {
  return (
    text
      .match(
        /[A-Z]{2}\d{2}[A-Z]{2}\d{2,3}|EM\d{2}[A-Z]{2}\d{2,3}|EF\d{2}[A-Z]{2}\d{2}/i,
      )?.[0]
      ?.toUpperCase() || ""
  );
}

function normalizeCandidate(value: unknown, source: "local" | "fallback"): SkillCandidate | null {
  if (typeof value === "string") {
    const codigo = parseSkillCode(value);
    const descricao = codigo
      ? value.replace(codigo, "").replace(/^[-–—:.\s]+/, "").trim()
      : value;

    if (!codigo && descricao.length < 18) {
      return null;
    }

    return {
      codigo: codigo || "BNCC",
      descricao,
      rawText: value,
      source,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as UnknownRecord;
  const allText = Object.values(record).map(normalizeText).join(" ");
  const codigo =
    normalizeText(
      getRecordValue(record, [
        "codigo",
        "código",
        "code",
        "habilidade_codigo",
        "habilidade",
      ]),
    ) || parseSkillCode(allText);

  const descricao = normalizeText(
    getRecordValue(record, [
      "descricao",
      "descrição",
      "description",
      "texto",
      "objeto",
      "nome",
    ]),
  );

  if (!codigo && !descricao) {
    return null;
  }

  return {
    codigo: codigo || "BNCC",
    descricao: descricao || allText || "Descrição não informada.",
    etapa: normalizeText(getRecordValue(record, ["etapa", "nivel", "segmento"])),
    anoSerie: normalizeText(
      getRecordValue(record, ["anoSerie", "ano_serie", "ano", "serie"]),
    ),
    area: normalizeText(
      getRecordValue(record, ["area", "areaConhecimento", "area_conhecimento"]),
    ),
    componente: normalizeText(
      getRecordValue(record, ["componente", "componenteCurricular", "disciplina"]),
    ),
    rawText: allText,
    source,
  };
}

function getJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getJsonFiles(full));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(full);
    }
  }

  return files;
}

let cachedLocalSkills: SkillCandidate[] | null = null;

function loadLocalSkills(): SkillCandidate[] {
  if (cachedLocalSkills) {
    return cachedLocalSkills;
  }

  const bnccDir = path.join(process.cwd(), "data", "bncc");
  const jsonFiles = getJsonFiles(bnccDir).slice(0, 30);
  const skills: SkillCandidate[] = [];

  for (const file of jsonFiles) {
    try {
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      const flattened = flatten(json);

      for (const item of flattened) {
        const skill = normalizeCandidate(item, "local");

        if (skill) {
          skills.push(skill);
        }
      }
    } catch {
      // Ignora JSON inválido sem travar a sugestão.
    }
  }

  const unique = new Map<string, SkillCandidate>();

  for (const skill of skills) {
    const key = `${skill.codigo}-${skill.descricao}`;

    if (!unique.has(key)) {
      unique.set(key, skill);
    }
  }

  cachedLocalSkills = Array.from(unique.values());
  return cachedLocalSkills;
}

function expandTerms(content: string): string[] {
  const normalized = normalizeSearch(content);
  const terms = new Set(
    normalized
      .split(/[^a-z0-9]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4 && !STOP_WORDS.has(term)),
  );

  const synonymGroups: Array<[RegExp, string[]]> = [
    [
      /dissert|argument|tese|redacao|enem/,
      [
        "argumentativo",
        "argumentacao",
        "argumentos",
        "tese",
        "repertorio",
        "sociocultural",
        "intervencao",
        "posicionamento",
        "ponto",
        "vista",
      ],
    ],
    [
      /norma|padrao|gramatica|coesao|coerencia/,
      ["coesao", "coerencia", "norma", "padrao", "registro", "linguistica"],
    ],
    [
      /repertorio|sociocultural|dados|filosofia|literatura|historia/,
      ["repertorio", "sociocultural", "fontes", "dados", "argumentos", "discursos"],
    ],
    [
      /texto|genero|narracao|descricao/,
      ["texto", "genero", "discursos", "linguagem", "producao"],
    ],
    [
      /leitura|interpretacao|infer/,
      ["leitura", "interpretacao", "sentidos", "inferir", "informacoes"],
    ],
  ];

  for (const [pattern, additions] of synonymGroups) {
    if (pattern.test(normalized)) {
      for (const term of additions) {
        terms.add(term);
      }
    }
  }

  return Array.from(terms);
}

function scoreCandidate(
  candidate: SkillCandidate,
  content: string,
  payload: BnccSuggestionPayload,
): number {
  const terms = expandTerms(content);
  const candidateText = normalizeSearch(
    `${candidate.codigo} ${candidate.descricao} ${candidate.rawText}`,
  );
  const etapa = normalizeSearch(getString(payload, ["etapa"]));
  const anoSerie = normalizeSearch(getString(payload, ["anoSerie", "serie", "ano"]));
  const area = normalizeSearch(getString(payload, ["areaConhecimento", "area"]));
  const componente = normalizeSearch(
    getString(payload, ["componenteCurricular", "componente"]),
  );

  let score = 0;

  for (const term of terms) {
    if (candidateText.includes(term)) {
      score += 5;
    }
  }

  if (candidate.etapa && etapa && normalizeSearch(candidate.etapa).includes(etapa)) {
    score += 10;
  }

  if (candidate.anoSerie && anoSerie && normalizeSearch(candidate.anoSerie).includes(anoSerie)) {
    score += 5;
  }

  if (candidate.area && area && normalizeSearch(candidate.area).includes(area)) {
    score += 10;
  }

  if (
    candidate.componente &&
    componente &&
    normalizeSearch(candidate.componente).includes(componente)
  ) {
    score += 12;
  }

  if (candidateText.includes(componente)) {
    score += 4;
  }

  if (candidateText.includes(area)) {
    score += 4;
  }

  if (etapa.includes("medio") && candidate.codigo.startsWith("EM")) {
    score += 8;
  }

  if (etapa.includes("fundamental") && candidate.codigo.startsWith("EF")) {
    score += 8;
  }

  if (componente.includes("lingua portuguesa") && /LP|LGG/.test(candidate.codigo)) {
    score += 6;
  }

  return score;
}

function chooseForContent(
  content: string,
  payload: BnccSuggestionPayload,
  candidates: SkillCandidate[],
): BnccSkillSuggestion[] {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, content, payload),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const chosen =
    ranked.length > 0
      ? ranked
      : FALLBACK_SKILLS.map((candidate) => ({
          candidate,
          score: scoreCandidate(candidate, content, payload),
        }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

  return chosen.map(({ candidate, score }, index) => {
    const codigo = candidate.codigo || `BNCC-${index + 1}`;
    const descricao = candidate.descricao || candidate.rawText;

    return {
      id: `${codigo}-${normalizeSearch(content).slice(0, 28)}-${index}`,
      codigo,
      descricao,
      texto: `${codigo} — ${descricao}`,
      label: `${codigo} — ${descricao}`,
      etapa: candidate.etapa,
      anoSerie: candidate.anoSerie,
      area: candidate.area,
      componente: candidate.componente,
      conteudo: content,
      score,
      source: candidate.source,
    };
  });
}

export function suggestBnccByConteudos(payload: BnccSuggestionPayload) {
  const conteudos = extractConteudosFromPayload(payload);

  if (conteudos.length === 0) {
    return {
      conteudos: [],
      habilidades: [],
      total: 0,
      source: "empty",
      message: "Informe pelo menos um conteúdo para sugerir habilidades BNCC.",
    };
  }

  const localSkills = loadLocalSkills();
  const candidates = localSkills.length > 0 ? localSkills : FALLBACK_SKILLS;

  const grouped = conteudos.map((conteudo) => ({
    conteudo,
    habilidades: chooseForContent(conteudo, payload, candidates),
  }));

  const flattened = grouped.flatMap((group) => group.habilidades);
  const unique = new Map<string, BnccSkillSuggestion>();

  for (const skill of flattened) {
    const key = `${skill.codigo}-${skill.descricao}-${skill.conteudo}`;

    if (!unique.has(key)) {
      unique.set(key, skill);
    }
  }

  const habilidades = Array.from(unique.values());

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: localSkills.length > 0 ? "local" : "fallback",
    message:
      habilidades.length > 0
        ? "Habilidades sugeridas a partir dos conteúdos informados."
        : "Nenhuma habilidade encontrada para os conteúdos informados.",
  };
}
