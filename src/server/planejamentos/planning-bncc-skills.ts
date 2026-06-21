import type { PlanningAiPayload, PlanningSkill } from "./planning-ai-service";

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

export function isSpanishHighSchoolPayload(payload?: PlanningAiPayload): boolean {
  if (!payload) return false;

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
    /[123]\s*(serie|ª serie|a serie)/.test(stage);

  return isSpanish && isHighSchool;
}

function spanishHighSchoolSkillCodesForContent(content: string): string[] {
  const normalized = normalizeSearch(content);
  const codes: string[] = [];

  if (
    /gramatic|gramatica|verbo|verbos|conjug|tempo verbal|presente|preterito|pretérito|futuro|imperativo|subjuntivo|ser\b|estar\b|tener\b|haber\b|gustar|pronome|pronombres|artigo|articulos|artículo|substantivo|sustantivo|adjetivo|adverbio|preposi|conect|vocab|vocabulario|vocabulário|lexico|léxico|numerais|numeros|alfabeto|pronuncia|fonetica|fonética/.test(
      normalized,
    )
  ) {
    codes.push("EM13LGG102");
  }

  if (
    /leitura|leer|lectura|interpret|compreens|comprension|compreensão|texto|textos|escrita|escribir|redacao|redação|producao textual|produção textual|oralidade|oral|fala|escuta|dialogo|diálogo|conversa|entrevista|genero textual|gênero textual|carta|email|e-mail|noticia|notícia|resenha|relato|roteiro|argument|opiniao|opinião/.test(
      normalized,
    )
  ) {
    codes.push("EM13LGG301");
  }

  if (
    /cultura|cultural|hispan|hispânico|hispanico|hispano|paises|países|pais|país|america latina|américa latina|latino|espanha|mexico|méxico|argentina|literatura|literario|literário|poesia|poema|conto|romance|autor|autores|obra|obras|diversidade|identidade|festividade|celebracao|celebração|mundo global|global|variedade|variacao|variação|sotaque|dialeto/.test(
      normalized,
    )
  ) {
    codes.push("EM13LGG401");
  }

  return Array.from(new Set(codes.length > 0 ? codes : ["EM13LGG401"])).slice(0, 2);
}

export function buildSpanishPlanningRules(payload: PlanningAiPayload): string {
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

/**
 * Motor determinístico de pareamento conteúdo ↔ habilidade BNCC.
 * Usado pelo planejamento sem IA e como fallback da IA.
 */
export function matchBnccSkillsToContent(
  content: string,
  skills: PlanningSkill[],
  payload?: PlanningAiPayload,
  contentIndex = 0,
): PlanningSkill[] {
  if (isSpanishHighSchoolPayload(payload)) {
    const codes = spanishHighSchoolSkillCodesForContent(content);
    const sourceSkills = skills.length > 0 ? skills : SPANISH_EM_PLANNING_SKILLS;
    const selected = codes
      .map(
        (code) =>
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
