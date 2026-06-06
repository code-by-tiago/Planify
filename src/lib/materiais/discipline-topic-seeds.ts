import { normalizeForPedagogy } from "./material-specialist-blueprints";

type TopicSeed = {
  id: string;
  match: (tema: string, component: string) => boolean;
  specialistLabel: string;
  mustCover: string[];
  questionTypes: string[];
  vocabulary: string[];
  commonErrors: string[];
  goldenExamples: string[];
};

function norm(value: string): string {
  return normalizeForPedagogy(value);
}

function temaIncludes(tema: string, ...needles: string[]): boolean {
  const t = norm(tema);
  return needles.some((needle) => t.includes(norm(needle)));
}

function isPortugueseComponent(component: string): boolean {
  const c = norm(component);
  return (
    c.includes("lingua portuguesa") ||
    c.includes("portugues") ||
    c.includes("redacao") ||
    c.includes("literatura") ||
    c.includes("escrita")
  );
}

function isMathComponent(component: string): boolean {
  const c = norm(component);
  return (
    c.includes("matematica") ||
    c.includes("algebra") ||
    c.includes("geometria") ||
    c.includes("estatistica")
  );
}

const TOPIC_SEEDS: TopicSeed[] = [
  {
    id: "lp-crase",
    match: (tema, component) =>
      isPortugueseComponent(component) && temaIncludes(tema, "crase"),
    specialistLabel: "Língua Portuguesa — uso da crase",
    mustCover: [
      "Crase facultativa antes de palavra feminina (à escola, à noite)",
      "Crase obrigatória em locuções adverbiais femininas (às vezes, à moda de)",
      "Casos de proibição da crase (a partir de, até às, antes de + masculino)",
      "Crase com pronomes demonstrativos e possessivos femininos (àquela, à sua)",
      "Diferença entre a (artigo), à (crase) e há (verbo haver)",
    ],
    questionTypes: [
      "Múltipla escolha com frases reais pedindo a forma correta (a/à/às/há)",
      "Reescrita corrigindo crase em parágrafo curto",
      "Justificativa gramatical citando a regra aplicada",
      "Identificação de locução adverbial feminina que exige crase",
    ],
    vocabulary: [
      "locução adverbial",
      "regência nominal",
      "artigo definido feminino",
      "crase facultativa",
      "crase proibida",
    ],
    commonErrors: [
      "Usar crase antes de verbo (à fazer, à estudar)",
      "Confundir há com a/à",
      "Omitir crase em locuções como à moda de, à medida que",
      "Inserir crase antes de palavra masculina ou plural masculino",
    ],
    goldenExamples: [
      "Fomos ___ praia ontem à tarde. (à — locução adverbial feminina)",
      "Ela chegou ___ escola antes do sinal. (à — regência feminina)",
      "___ três anos não viajo. (Há — verbo haver, sem crase)",
      "O aluno foi ___ diretor pedir informações. (ao — masculino, sem crase)",
    ],
  },
  {
    id: "lp-acentuacao",
    match: (tema, component) =>
      isPortugueseComponent(component) &&
      temaIncludes(tema, "acentuacao", "acentuação", "oxitona", "paroxitona", "proparoxitona"),
    specialistLabel: "Língua Portuguesa — acentuação gráfica",
    mustCover: [
      "Regras de oxítonas, paroxítonas e proparoxítonas",
      "Acento diferencial (pôr/por, pára/para)",
      "Monossílabos tônicos e átonos",
      "Hiato e ditongo em casos de acento",
    ],
    questionTypes: [
      "Classificação silábica com acentuação",
      "Correção ortográfica em lista de palavras",
      "Múltipla escolha justificando a regra",
    ],
    vocabulary: ["oxítona", "paroxítona", "proparoxítona", "hiato", "ditongo", "tônico"],
    commonErrors: [
      "Acentuar paroxítona terminada em a, e, o sem acento",
      "Confundir regra de hiato com ditongo",
    ],
    goldenExamples: [
      "café (oxítona terminada em e)",
      "mesa (paroxítona terminada em a — sem acento)",
      "médico (proparoxítona — sempre acentuada)",
    ],
  },
  {
    id: "lp-interpretacao",
    match: (tema, component) =>
      isPortugueseComponent(component) &&
      temaIncludes(tema, "interpretacao", "interpretação", "texto", "leitura", "inferencia", "inferência"),
    specialistLabel: "Língua Portuguesa — interpretação de texto",
    mustCover: [
      "Leitura de texto-base com gênero identificado",
      "Inferência a partir de evidências do texto",
      "Vocabulário em contexto",
      "Relação autor-leitor e intencionalidade",
    ],
    questionTypes: [
      "Questões objetivas ancoradas em trecho específico",
      "Inferência e efeito de sentido",
      "Substituição vocabular mantendo sentido",
      "Produção curta com retomada de ideias do texto",
    ],
    vocabulary: ["inferência", "coesão", "coerência", "gênero textual", "intertextualidade"],
    commonErrors: [
      "Perguntas que não exigem leitura do texto-base",
      "Respostas copiadas literalmente sem interpretação",
    ],
    goldenExamples: [
      "Com base no 2º parágrafo, o autor sugere que...",
      "A expressão 'X' no contexto significa...",
    ],
  },
  {
    id: "mat-fracoes",
    match: (tema, component) =>
      isMathComponent(component) &&
      temaIncludes(tema, "fracao", "fração", "fracoes", "frações"),
    specialistLabel: "Matemática — frações",
    mustCover: [
      "Representação fracionária e equivalência",
      "Comparação de frações (mesmo denominador e numeradores diferentes)",
      "Operações com frações em contexto",
      "Fração como parte de um todo e na reta numérica",
    ],
    questionTypes: [
      "Problemas contextualizados com frações",
      "Comparação e ordenação",
      "Cálculo com desenvolvimento",
      "Representação gráfica ou em tabela",
    ],
    vocabulary: ["numerador", "denominador", "equivalente", "irredutível", "mínimo comum múltiplo"],
    commonErrors: [
      "Somar numeradores e denominadores separadamente sem mmc",
      "Comparar frações apenas pelo numerador",
    ],
    goldenExamples: [
      "João comeu 2/8 de uma pizza e Maria 1/4. Quem comeu mais?",
      "Escreva três frações equivalentes a 3/5.",
    ],
  },
  {
    id: "lp-concordancia",
    match: (tema, component) =>
      isPortugueseComponent(component) &&
      temaIncludes(
        tema,
        "concordancia",
        "concordância",
        "verbal",
        "nominal",
      ),
    specialistLabel: "Língua Portuguesa — concordância verbal e nominal",
    mustCover: [
      "Concordância do verbo com o sujeito em número e pessoa",
      "Concordância do adjetivo, artigo e pronome com o núcleo",
      "Casos de sujeito composto e coletivo",
      "Concordância com porcentagens e expressões partitivas",
    ],
    questionTypes: [
      "Correção de frases com erro de concordância",
      "Múltipla escolha identificando a forma correta",
      "Reescrita mantendo sentido e corrigindo concordância",
    ],
    vocabulary: ["sujeito", "predicado", "núcleo", "modificador", "coletivo", "partitivo"],
    commonErrors: [
      "Verbo no singular com sujeito composto sem nuance de ação individual",
      "Adjetivo concordando com termo errado",
    ],
    goldenExamples: [
      "Fazem dois anos que não viajo. (verbo com sujeito ‘dois anos’)",
      "A maioria dos alunos compareceu. (sentido partitivo ou coletivo)",
    ],
  },
  {
    id: "mat-equacoes",
    match: (tema, component) =>
      isMathComponent(component) &&
      temaIncludes(tema, "equacao", "equação", "equacoes", "equações", "1o grau", "1º grau"),
    specialistLabel: "Matemática — equações do 1º grau",
    mustCover: [
      "Princípio da equivalência nas transformações",
      "Isolamento da incógnita com desenvolvimento",
      "Problemas contextualizados traduzidos em equação",
      "Verificação da solução no contexto",
    ],
    questionTypes: [
      "Resolver e verificar equações",
      "Montar equação a partir de enunciado",
      "Interpretar solução impossível ou infinita quando cabível",
    ],
    vocabulary: ["incógnita", "membro", "transposição", "verificação", "raiz"],
    commonErrors: [
      "Trocar sinal apenas de um membro",
      "Ignorar unidade de medida no problema",
    ],
    goldenExamples: [
      "2x + 5 = 17 → x = 6",
      "O dobro de um número somado a 8 é 26. Qual é o número?",
    ],
  },
  {
    id: "mat-porcentagem",
    match: (tema, component) =>
      isMathComponent(component) &&
      temaIncludes(tema, "porcentagem", "percentual", "desconto", "juros"),
    specialistLabel: "Matemática — porcentagem",
    mustCover: [
      "Relação fração, decimal e porcentagem",
      "Cálculo de acréscimo e desconto",
      "Problemas do cotidiano (preço, salário, estatística simples)",
    ],
    questionTypes: [
      "Problemas com tabela ou propaganda",
      "Cálculo direto e inverso",
      "Interpretação de gráfico simples",
    ],
    vocabulary: ["percentual", "acréscimo", "desconto", "índice", "proporção"],
    commonErrors: [
      "Aplicar porcentagem sobre valor já alterado sem indicar a base",
      "Confundir pontos percentuais com porcentagem relativa",
    ],
    goldenExamples: [
      "Um produto de R$ 80 teve 15% de desconto. Qual o preço final?",
      "Em uma turma de 40 alunos, 25% faltaram. Quantos compareceram?",
    ],
  },
];

export type DisciplineTopicGuidance = {
  seedId: string;
  specialistLabel: string;
  promptBlock: string;
};

export function resolveDisciplineTopicGuidance(params: {
  tema: string;
  componenteCurricular: string;
}): DisciplineTopicGuidance | null {
  const tema = String(params.tema || "").trim();
  const component = String(params.componenteCurricular || "").trim();
  if (!tema) return null;

  const seed = TOPIC_SEEDS.find((item) => item.match(tema, component));
  if (!seed) return null;

  const lines = [
    `REFERÊNCIA PEDAGÓGICA PLANIFY — ${seed.specialistLabel}`,
    `Tema do professor: “${tema}”.`,
    "",
    "O QUE O MATERIAL DEVE COBRIR (obrigatório):",
    ...seed.mustCover.map((item) => `- ${item}`),
    "",
    "TIPOS DE QUESTÃO/ATIVIDADE RECOMENDADOS:",
    ...seed.questionTypes.map((item) => `- ${item}`),
    "",
    "VOCABULÁRIO ESPERADO:",
    seed.vocabulary.join(", "),
    "",
    "ERROS COMUNS DOS ALUNOS (explorar na avaliação):",
    ...seed.commonErrors.map((item) => `- ${item}`),
    "",
    "EXEMPLOS OURO (inspire-se, não copie literalmente):",
    ...seed.goldenExamples.map((item) => `- ${item}`),
    "",
    "REGRA: cada questão ou seção deve citar o tema ou um subconceito listado acima. Proibido enunciado genérico.",
  ];

  return {
    seedId: seed.id,
    promptBlock: lines.join("\n"),
    specialistLabel: seed.specialistLabel,
  };
}
