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
    /fracao|decimal|numero|racional|inteiro|porcentagem|percentual/,
    ["fracoes", "decimais", "numeros", "racionais", "operacoes", "multiplicacao", "divisao"],
  ],
  [
    /geometr|angulo|triangulo|circulo|poligono|area|perimetro|volume/,
    ["geometria", "figuras", "planas", "espaciais", "medidas", "angulos", "poligonos"],
  ],
  [
    /equacao|algebra|funcao|grafico|expressao/,
    ["equacoes", "algebraicas", "funcoes", "graficos", "variaveis", "expressoes"],
  ],
  [
    /colonia|escravid|independencia|imperio|republica|brasil|colonizacao/,
    ["colonia", "escravidao", "independencia", "imperio", "republica", "brasil", "historia", "sociedade"],
  ],
  [
    /territorio|clima|populacao|urbanizacao|geografia|mapa|regiao/,
    ["territorio", "espaco", "geografico", "paisagem", "ambiente", "regioes", "mapas"],
  ],
  [
    /corpo|seres|vivos|ecossistema|energia|materiais|ciencias/,
    ["organismos", "corpo", "humano", "materiais", "energia", "ecossistemas", "natureza", "fenomenos"],
  ],
  [
    /celula|genetica|evolucao|dna|organismo/,
    ["celulas", "genetica", "hereditariedade", "evolucao", "organismos", "vida"],
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
