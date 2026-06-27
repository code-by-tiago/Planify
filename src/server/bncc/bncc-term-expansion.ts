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
  "revisao",
  "tipos",
  "competencias",
  "estrutura",
]);

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYNONYM_GROUPS: Array<[RegExp, string[]]> = [
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
      "texto",
      "opiniao",
      "proposta",
      "intervencao",
      "detalhada",
      "norma",
      "padrao",
      "competencia",
      "redacao",
      "enem",
    ],
  ],
  [
    /norma|padrao|gramatica|ortograf|pontuac/,
    ["norma", "padrao", "registro", "linguistica", "ortografia", "pontuacao", "concordancia"],
  ],
  [
    /coesao|coerencia/,
    ["coesao", "coerencia", "continuidade", "progressao", "articulacao", "conectores"],
  ],
  [
    /repertorio|sociocultural|filosofia/,
    ["repertorio", "sociocultural", "fontes", "dados", "citacoes", "intertextualidade"],
  ],
  [
    /texto|genero|narracao|descricao|dissert/,
    ["texto", "genero", "discursos", "linguagem", "producao", "leitura", "escrita"],
  ],
  [
    /leitura|interpretacao|infer/,
    ["leitura", "interpretacao", "sentidos", "inferir", "informacoes", "compreensao"],
  ],
  [
    /sintaxe|semantica|orac|coordenad|subordinad|reduzid|regencia|crase|pronominal|periodo|concordancia|colocacao/,
    [
      "sintaxe",
      "semantica",
      "oracoes",
      "coordenacao",
      "subordinacao",
      "regencia",
      "crase",
      "pronominal",
      "concordancia",
      "periodo",
      "gramatica",
      "sintagmas",
      "modalizadores",
    ],
  ],
  [
    /fracao|decimal|numero|racional|inteiro|porcentagem|percentual|multiplic|divis/,
    [
      "fracoes",
      "decimais",
      "numeros",
      "racionais",
      "operacoes",
      "multiplicacao",
      "divisao",
      "partes",
      "equivalentes",
      "comparacao",
      "medidas",
    ],
  ],
  [
    /geometr|angulo|triangulo|circulo|poligono|area|perimetro|volume|figura/,
    [
      "geometria",
      "figuras",
      "planas",
      "espaciais",
      "medidas",
      "angulos",
      "poligonos",
      "triangulos",
      "retas",
      "coordenadas",
    ],
  ],
  [
    /equacao|algebra|funcao|grafico|expressao|variavel|proporc/,
    [
      "equacoes",
      "algebraicas",
      "funcoes",
      "graficos",
      "variaveis",
      "expressoes",
      "proporcionalidade",
      "razao",
      "grandezas",
    ],
  ],
  [
    /colonia|escravid|independencia|imperio|republica|brasil|colonizacao|monarquia|escravo|independencia/,
    [
      "colonia",
      "escravidao",
      "independencia",
      "imperio",
      "republica",
      "brasil",
      "historia",
      "sociedade",
      "colonizacao",
      "monarquia",
      "escravos",
      "africanos",
      "indigenas",
      "portugal",
    ],
  ],
  [
    /territorio|clima|populacao|urbanizacao|geografia|mapa|regiao/,
    ["territorio", "espaco", "geografico", "paisagem", "ambiente", "regioes", "mapas"],
  ],
  [
    /corpo|seres|vivos|ecossistema|energia|materiais|ciencias|propriedade/,
    [
      "organismos",
      "corpo",
      "humano",
      "materiais",
      "energia",
      "ecossistemas",
      "natureza",
      "fenomenos",
      "propriedades",
      "substancias",
      "ambiente",
      "saude",
    ],
  ],
  [
    /celula|genetica|evolucao|dna|organismo|microorganismo/,
    ["celulas", "genetica", "hereditariedade", "evolucao", "organismos", "vida", "microorganismos"],
  ],
  [
    /movimento|forca|newton|energia|fisica/,
    ["movimento", "forcas", "energia", "fisica", "mecanica", "velocidade"],
  ],
  [
    /reacao|quimica|atomo|molecula|tabela/,
    ["reacoes", "quimicas", "atomos", "moleculas", "substancias", "materiais"],
  ],
];

export function expandContentTerms(content: string): string[] {
  const normalized = normalizeSearch(content);
  const terms = new Set(
    normalized
      .split(/[^a-z0-9]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3 && !STOP_WORDS.has(term)),
  );

  for (const [pattern, additions] of SYNONYM_GROUPS) {
    if (pattern.test(normalized)) {
      for (const term of additions) {
        terms.add(term);
      }
    }
  }

  return Array.from(terms);
}
