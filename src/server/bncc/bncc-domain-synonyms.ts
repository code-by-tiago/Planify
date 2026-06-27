function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type DomainSynonymRule = {
  pattern: RegExp;
  terms: string[];
};

const LP_RULES: DomainSynonymRule[] = [
  [
    /conotac|denotac|sentido|expressiv|figura|metafor|eufem|iron|paradox/,
    [
      "conotacao",
      "denotacao",
      "sentido",
      "expressivo",
      "efeitos",
      "palavras",
      "expressoes",
      "figuras",
      "linguagem",
      "semantica",
    ],
  ],
  [
    /variacao linguistica|prestigio|estigmatiz|dialet|registro|norma padrao|sociolect/,
    [
      "variacao",
      "linguistica",
      "variedades",
      "prestigio",
      "estigmatizadas",
      "regional",
      "social",
      "preconceitos",
      "linguisticos",
    ],
  ],
  [
    /verbal|nao verbal|naoverbal|mista|semios|gestual|paralingu|cinésic|multimodal/,
    [
      "verbais",
      "visuais",
      "sonoras",
      "gestuais",
      "semioses",
      "linguagens",
      "funcionamento",
      "discursos",
      "multissemioticas",
    ],
  ],
  [
    /dissert|argument|tese|redacao|enem|intervenc/,
    [
      "argumentativo",
      "argumentacao",
      "argumentos",
      "tese",
      "repertorio",
      "sociocultural",
      "intervencao",
      "posicionamento",
      "refutacao",
    ],
  ],
  [
    /coesao|coerencia/,
    ["coesao", "coerencia", "continuidade", "progressao", "conectores", "articulacao"],
  ],
  [
    /sintaxe|semantica|orac|gramatica|regencia|crase|concordancia/,
    [
      "sintaxe",
      "semantica",
      "oracoes",
      "gramatica",
      "regencia",
      "crase",
      "concordancia",
      "periodo",
    ],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const MAT_RULES: DomainSynonymRule[] = [
  [
    /fracao|decimal|racional|inteiro|porcentagem|percentual/,
    ["fracoes", "decimais", "racionais", "numeros", "partes", "equivalentes", "comparacao"],
  ],
  [
    /geometr|angulo|triangulo|circulo|poligono|area|perimetro|volume/,
    ["geometria", "figuras", "planas", "espaciais", "medidas", "angulos", "poligonos"],
  ],
  [
    /equacao|algebra|funcao|grafico|variavel|proporc/,
    ["equacoes", "algebraicas", "funcoes", "graficos", "variaveis", "proporcionalidade"],
  ],
  [
    /estatistica|probabilidade|media|mediana|dados/,
    ["estatistica", "probabilidade", "dados", "variaveis", "graficos", "tendencia"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const HIS_RULES: DomainSynonymRule[] = [
  [
    /colonia|escravid|independencia|imperio|republica|brasil|colonizacao|monarquia/,
    [
      "colonia",
      "escravidao",
      "independencia",
      "imperio",
      "republica",
      "brasil",
      "historia",
      "colonizacao",
      "monarquia",
    ],
  ],
  [
    /guerra|revolucao|ditadura|democracia|estado|politica/,
    ["guerra", "revolucao", "ditadura", "democracia", "estado", "poder", "politica"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const GEO_RULES: DomainSynonymRule[] = [
  [
    /territorio|clima|populacao|urbanizacao|mapa|regiao|paisagem/,
    ["territorio", "espaco", "geografico", "paisagem", "ambiente", "regioes", "mapas", "clima"],
  ],
  [
    /globalizacao|migracao|industrializacao|recursos naturais/,
    ["globalizacao", "migracao", "industrializacao", "recursos", "naturais", "desenvolvimento"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const CI_RULES: DomainSynonymRule[] = [
  [
    /corpo|seres|vivos|ecossistema|energia|materiais|propriedade/,
    [
      "organismos",
      "corpo",
      "humano",
      "materiais",
      "energia",
      "ecossistemas",
      "fenomenos",
      "propriedades",
    ],
  ],
  [
    /celula|genetica|evolucao|dna|microorganismo/,
    ["celulas", "genetica", "hereditariedade", "evolucao", "organismos", "vida"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const ARTE_RULES: DomainSynonymRule[] = [
  [
    /pintura|escultura|desenho|artes visuais|grafite|colagem/,
    ["artes", "visuais", "pintura", "escultura", "desenho", "composicao", "formas", "cores"],
  ],
  [
    /musica|danca|teatro|performace|expressao artistica/,
    ["musica", "danca", "teatro", "expressao", "artistica", "linguagens", "corporal"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const EF_RULES: DomainSynonymRule[] = [
  [
    /jogo|brincadeira|esporte|ginastica|corpo|movimento/,
    ["jogos", "brincadeiras", "esportes", "ginastica", "corpo", "movimento", "praticas"],
  ],
  [
    /saude|alimentacao|postura|condicionamento/,
    ["saude", "alimentacao", "postura", "condicionamento", "qualidade", "vida"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const LI_RULES: DomainSynonymRule[] = [
  [
    /vocabulario|gramatica|verbo|tempo verbal|pronuncia|listening|reading/,
    ["vocabulario", "gramatica", "verbos", "tempos", "verbais", "leitura", "escuta", "oralidade"],
  ],
  [
    /cultura|intercultural|global|variacao linguistica inglesa/,
    ["cultura", "intercultural", "global", "variacao", "linguistica", "diversidade"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const ER_RULES: DomainSynonymRule[] = [
  [
    /religiao|fe|biblia|cristianismo|espiritualidade|valores/,
    ["religiao", "fe", "espiritualidade", "valores", "tradicao", "cultura", "etica"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const EM_TRANSVERSAL_RULES: DomainSynonymRule[] = [
  [
    /educacao financeira|financas|orcamento|juros|investimento|consumo/,
    [
      "financeira",
      "financas",
      "orcamento",
      "juros",
      "investimento",
      "consumo",
      "economia",
      "planejamento",
    ],
  ],
  [
    /sustentabilidade|meio ambiente|agenda 2030|ods/,
    ["sustentabilidade", "ambiente", "recursos", "desenvolvimento", "sociedade"],
  ],
].map(([pattern, terms]) => ({ pattern: pattern as RegExp, terms: terms as string[] }));

const DOMAIN_RULES: Record<string, DomainSynonymRule[]> = {
  lp: LP_RULES,
  lingua_portuguesa: LP_RULES,
  redacao: LP_RULES,
  escrita_criativa: LP_RULES,
  mat: MAT_RULES,
  matematica: MAT_RULES,
  his: HIS_RULES,
  historia: HIS_RULES,
  geo: GEO_RULES,
  geografia: GEO_RULES,
  ci: CI_RULES,
  ciencias: CI_RULES,
  biologia: CI_RULES,
  fisica: CI_RULES,
  quimica: CI_RULES,
  arte: ARTE_RULES,
  educacao_fisica: EF_RULES,
  li: LI_RULES,
  lingua_inglesa: LI_RULES,
  lingua_espanhola: LI_RULES,
  er: ER_RULES,
  ensino_religioso: ER_RULES,
  filosofia: HIS_RULES,
  sociologia: HIS_RULES,
  em_transversal: EM_TRANSVERSAL_RULES,
};

function resolveDomainKey(componenteCurricular?: string): string[] {
  const normalized = normalizeKey(componenteCurricular || "");
  const keys = new Set<string>();

  if (!normalized) {
    return ["em_transversal"];
  }

  for (const [key, rules] of Object.entries(DOMAIN_RULES)) {
    if (normalized.includes(key.replace(/_/g, " ")) || normalized.includes(key)) {
      keys.add(key);
    }
  }

  if (/portugues/.test(normalized) && !/espan/.test(normalized)) keys.add("lp");
  if (/matematica/.test(normalized)) keys.add("matematica");
  if (/historia/.test(normalized)) keys.add("historia");
  if (/geografia/.test(normalized)) keys.add("geografia");
  if (/ciencias|biologia|fisica|quimica/.test(normalized)) keys.add("ciencias");
  if (/arte/.test(normalized)) keys.add("arte");
  if (/educacao fisica/.test(normalized)) keys.add("educacao_fisica");
  if (/ingles|espanhol/.test(normalized)) keys.add("lingua_inglesa");
  if (/religioso/.test(normalized)) keys.add("ensino_religioso");
  if (/financeir/.test(normalized)) keys.add("em_transversal");

  if (keys.size === 0) {
    keys.add("em_transversal");
  }

  return Array.from(keys);
}

export function expandDomainSynonyms(
  content: string,
  componenteCurricular?: string,
): string[] {
  const normalized = normalizeKey(content);
  const additions = new Set<string>();
  const domainKeys = resolveDomainKey(componenteCurricular);

  for (const domainKey of domainKeys) {
    const rules = DOMAIN_RULES[domainKey] || [];

    for (const rule of rules) {
      if (rule.pattern.test(normalized)) {
        for (const term of rule.terms) {
          additions.add(term);
        }
      }
    }
  }

  return Array.from(additions);
}
