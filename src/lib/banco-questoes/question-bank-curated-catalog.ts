import type { QuestionBankItem } from "@/types/question-bank";

type CuratedQuestionInput = {
  id: string;
  enunciado: string;
  tipo?: string;
  alternativas?: string[];
  respostaEsperada: string;
  criterioCorrecao?: string;
  componente: string;
  anoSerie: string;
  etapa: string;
  tema: string;
  tags?: string[];
  bnccCodigos?: string[];
};

const CREATED_AT = "2026-01-01T00:00:00.000Z";

function curatedQuestion(input: CuratedQuestionInput): QuestionBankItem {
  return {
    id: `curated-planify-${input.id}`,
    enunciado: input.enunciado,
    tipo: input.tipo ?? (input.alternativas?.length ? "objetiva" : "discursiva"),
    alternativas: input.alternativas ?? [],
    respostaEsperada: input.respostaEsperada,
    criterioCorrecao:
      input.criterioCorrecao ??
      "Verificar domínio conceitual, justificativa e adequação ao comando.",
    componente: input.componente,
    anoSerie: input.anoSerie,
    etapa: input.etapa,
    tema: input.tema,
    bnccCodigos: input.bnccCodigos ?? [],
    tags: ["catalogo-planify", "curadoria", ...(input.tags ?? [])],
    sourceTitle: "Planify Catálogo Curado",
    sourceType: "ingest:ai:planify-catalog",
    collection: "escolar",
    reviewStatus: "automated",
    qualityScore: 8.8,
    reviewedAt: CREATED_AT,
    isCommunity: true,
    authorName: "Planify Curadoria",
    usageCount: 0,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

export const CURATED_QUESTION_BANK_ITEMS: QuestionBankItem[] = [
  curatedQuestion({
    id: "lp-em1-crase-01",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Crase",
    tags: ["crase", "regencia", "locucao-adverbial"],
    enunciado:
      "Assinale a alternativa em que o uso da crase está correto.",
    alternativas: [
      "Cheguei à escola antes do início da aula.",
      "Comecei à estudar para a prova.",
      "Entreguei o trabalho à ele ontem.",
      "Voltamos à pé para casa.",
    ],
    respostaEsperada: "A. Cheguei à escola antes do início da aula.",
    criterioCorrecao:
      "A crase ocorre pela fusão da preposição a com o artigo feminino a antes de escola.",
  }),
  curatedQuestion({
    id: "lp-em1-crase-02",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Crase",
    tags: ["crase", "locucoes", "gramatica"],
    enunciado:
      "Na frase 'O professor explicou o conteúdo ___ turma ___ tarde', quais formas completam corretamente as lacunas?",
    alternativas: ["a / a", "à / à", "à / a", "a / à"],
    respostaEsperada: "B. à / à",
    criterioCorrecao:
      "Usa-se crase em 'à turma' pela regência de explicar algo a alguém e em 'à tarde' por locução adverbial feminina.",
  }),
  curatedQuestion({
    id: "lp-em1-crase-03",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Crase",
    tags: ["crase", "reescrita", "gramatica"],
    enunciado:
      "Reescreva a frase corrigindo o emprego da crase quando necessário: 'Os alunos foram à pé até a biblioteca e chegaram a sala de leitura.'",
    respostaEsperada:
      "Os alunos foram a pé até a biblioteca e chegaram à sala de leitura.",
    criterioCorrecao:
      "Não há crase em 'a pé'; há crase em 'à sala' pela regência de chegar a + artigo feminino.",
  }),
  curatedQuestion({
    id: "lp-em1-regencia-01",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Regência verbal",
    tags: ["regencia", "gramatica", "verbos"],
    enunciado:
      "Assinale a frase em que a regência verbal está de acordo com a norma-padrão.",
    alternativas: [
      "Assisti o filme indicado pela professora.",
      "Prefiro mais estudar de manhã do que à noite.",
      "Obedeço às orientações do laboratório.",
      "Namoro com a colega da turma.",
    ],
    respostaEsperada: "C. Obedeço às orientações do laboratório.",
    criterioCorrecao:
      "O verbo obedecer exige preposição a: obedecer a algo/alguém.",
  }),
  curatedQuestion({
    id: "lp-em1-figuras-01",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Figuras de linguagem",
    tags: ["figuras-de-linguagem", "metafora", "interpretacao"],
    enunciado:
      "Na frase 'A notícia caiu como uma bomba na escola', qual figura de linguagem predomina?",
    alternativas: ["Metáfora", "Comparação", "Eufemismo", "Personificação"],
    respostaEsperada: "B. Comparação",
    criterioCorrecao:
      "A expressão usa o conectivo 'como' para aproximar dois elementos, caracterizando comparação.",
  }),
  curatedQuestion({
    id: "lp-em1-figuras-02",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Figuras de linguagem",
    tags: ["figuras-de-linguagem", "hiperbole", "efeito-de-sentido"],
    enunciado:
      "Em 'Já falei isso mil vezes', a expressão produz efeito de exagero. Que figura de linguagem aparece?",
    alternativas: ["Ironia", "Hipérbole", "Antítese", "Metonímia"],
    respostaEsperada: "B. Hipérbole",
    criterioCorrecao:
      "A hipérbole intensifica uma ideia por meio de exagero intencional.",
  }),
  curatedQuestion({
    id: "lp-em1-interpretacao-01",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Interpretação de texto",
    tags: ["interpretacao", "inferencia", "leitura"],
    enunciado:
      "Ao interpretar um texto argumentativo, qual estratégia ajuda a identificar a tese defendida pelo autor?",
    alternativas: [
      "Ler apenas o título e ignorar os conectivos.",
      "Observar a ideia central sustentada por argumentos ao longo do texto.",
      "Selecionar a primeira palavra desconhecida do texto.",
      "Contar quantos parágrafos o texto possui.",
    ],
    respostaEsperada:
      "B. Observar a ideia central sustentada por argumentos ao longo do texto.",
  }),
  curatedQuestion({
    id: "lp-em1-concordancia-01",
    componente: "Língua Portuguesa",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Concordância verbal",
    tags: ["concordancia", "sujeito", "verbo"],
    enunciado:
      "Assinale a alternativa em que a concordância verbal está correta.",
    alternativas: [
      "Houveram muitas dúvidas na revisão.",
      "Fazem dois anos que estudo na escola.",
      "Existem diferentes formas de resolver o problema.",
      "A turma chegaram cedo ao auditório.",
    ],
    respostaEsperada:
      "C. Existem diferentes formas de resolver o problema.",
    criterioCorrecao:
      "O verbo existir concorda com o sujeito plural 'diferentes formas'.",
  }),
  curatedQuestion({
    id: "lp-ef8-crase-01",
    componente: "Língua Portuguesa",
    anoSerie: "8º ano",
    etapa: "Ensino Fundamental",
    tema: "Crase",
    tags: ["crase", "gramatica"],
    enunciado:
      "Complete corretamente: 'A visita ___ exposição acontecerá ___ 14 horas.'",
    alternativas: ["a / as", "à / às", "à / as", "a / às"],
    respostaEsperada: "B. à / às",
  }),
  curatedQuestion({
    id: "lp-ef8-figuras-01",
    componente: "Língua Portuguesa",
    anoSerie: "8º ano",
    etapa: "Ensino Fundamental",
    tema: "Figuras de linguagem",
    tags: ["figuras-de-linguagem", "metafora"],
    enunciado:
      "Na frase 'Seus olhos eram duas estrelas', qual figura de linguagem foi usada?",
    alternativas: ["Metáfora", "Ironia", "Eufemismo", "Pleonasmo"],
    respostaEsperada: "A. Metáfora",
  }),
  curatedQuestion({
    id: "lp-ef6-generos-01",
    componente: "Língua Portuguesa",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    tema: "Gêneros textuais",
    tags: ["generos-textuais", "bilhete", "finalidade"],
    enunciado:
      "Um bilhete deixado na porta da sala geralmente tem qual finalidade comunicativa?",
    alternativas: [
      "Narrar uma história longa.",
      "Transmitir um recado breve e direto.",
      "Defender uma tese científica.",
      "Apresentar uma lei municipal.",
    ],
    respostaEsperada: "B. Transmitir um recado breve e direto.",
  }),
  curatedQuestion({
    id: "mat-ef6-fracoes-01",
    componente: "Matemática",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    tema: "Frações",
    tags: ["fracoes", "representacao"],
    enunciado:
      "Uma pizza foi dividida em 8 partes iguais. Ana comeu 3 partes. Qual fração representa a parte comida?",
    alternativas: ["1/8", "3/8", "5/8", "8/3"],
    respostaEsperada: "B. 3/8",
  }),
  curatedQuestion({
    id: "mat-ef6-fracoes-02",
    componente: "Matemática",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    tema: "Frações equivalentes",
    tags: ["fracoes", "equivalencia"],
    enunciado:
      "Qual fração é equivalente a 2/3?",
    alternativas: ["3/2", "4/6", "2/6", "6/4"],
    respostaEsperada: "B. 4/6",
  }),
  curatedQuestion({
    id: "mat-ef8-equacoes-01",
    componente: "Matemática",
    anoSerie: "8º ano",
    etapa: "Ensino Fundamental",
    tema: "Equações do 1º grau",
    tags: ["equacoes", "algebra"],
    enunciado:
      "Resolva a equação 2x + 5 = 17.",
    alternativas: ["x = 4", "x = 5", "x = 6", "x = 11"],
    respostaEsperada: "C. x = 6",
  }),
  curatedQuestion({
    id: "mat-ef7-porcentagem-01",
    componente: "Matemática",
    anoSerie: "7º ano",
    etapa: "Ensino Fundamental",
    tema: "Porcentagem",
    tags: ["porcentagem", "desconto"],
    enunciado:
      "Um produto de R$ 200,00 recebeu desconto de 10%. Qual é o novo preço?",
    alternativas: ["R$ 20,00", "R$ 180,00", "R$ 190,00", "R$ 210,00"],
    respostaEsperada: "B. R$ 180,00",
  }),
  curatedQuestion({
    id: "mat-em1-funcoes-01",
    componente: "Matemática",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Função afim",
    tags: ["funcoes", "funcao-afim"],
    enunciado:
      "Na função f(x) = 2x + 3, qual é o valor de f(4)?",
    alternativas: ["7", "8", "11", "14"],
    respostaEsperada: "C. 11",
  }),
  curatedQuestion({
    id: "mat-em1-trigonometria-01",
    componente: "Matemática",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Trigonometria",
    tags: ["trigonometria", "seno", "cosseno"],
    enunciado:
      "Em um triângulo retângulo, o seno de um ângulo agudo corresponde à razão entre:",
    alternativas: [
      "cateto adjacente e hipotenusa",
      "cateto oposto e hipotenusa",
      "hipotenusa e cateto oposto",
      "cateto oposto e cateto adjacente",
    ],
    respostaEsperada: "B. cateto oposto e hipotenusa",
  }),
  curatedQuestion({
    id: "cie-ef6-fotossintese-01",
    componente: "Ciências",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    tema: "Fotossíntese",
    tags: ["fotossintese", "plantas", "energia"],
    enunciado:
      "Qual é a principal função da fotossíntese para as plantas?",
    alternativas: [
      "Produzir alimento usando luz, água e gás carbônico.",
      "Eliminar todas as folhas durante o dia.",
      "Transformar oxigênio em água salgada.",
      "Impedir a respiração celular.",
    ],
    respostaEsperada:
      "A. Produzir alimento usando luz, água e gás carbônico.",
  }),
  curatedQuestion({
    id: "cie-ef5-sistema-solar-01",
    componente: "Ciências",
    anoSerie: "5º ano",
    etapa: "Ensino Fundamental",
    tema: "Sistema Solar",
    tags: ["sistema-solar", "planetas"],
    enunciado:
      "Qual astro fica no centro do Sistema Solar e fornece luz e calor para a Terra?",
    alternativas: ["Lua", "Sol", "Marte", "Saturno"],
    respostaEsperada: "B. Sol",
  }),
  curatedQuestion({
    id: "bio-em1-celulas-01",
    componente: "Biologia",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Células",
    tags: ["celulas", "biologia"],
    enunciado:
      "Qual estrutura celular é conhecida por produzir energia por meio da respiração celular?",
    alternativas: ["Ribossomo", "Mitocôndria", "Lisossomo", "Complexo golgiense"],
    respostaEsperada: "B. Mitocôndria",
  }),
  curatedQuestion({
    id: "hist-ef5-brasil-colonial-01",
    componente: "História",
    anoSerie: "5º ano",
    etapa: "Ensino Fundamental",
    tema: "Brasil colonial",
    tags: ["brasil-colonial", "escravidao"],
    enunciado:
      "Explique uma consequência social da escravidão no Brasil colonial que ainda pode ser percebida na sociedade atual.",
    respostaEsperada:
      "Espera-se que o aluno relacione a escravidão a desigualdades sociais, racismo estrutural ou exclusão histórica.",
  }),
  curatedQuestion({
    id: "hist-em1-revolucao-industrial-01",
    componente: "História",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Revolução Industrial",
    tags: ["revolucao-industrial", "trabalho", "industrializacao"],
    enunciado:
      "Qual mudança é característica da Revolução Industrial?",
    alternativas: [
      "Predomínio absoluto do trabalho artesanal doméstico.",
      "Expansão das fábricas e do uso de máquinas na produção.",
      "Fim imediato das cidades europeias.",
      "Substituição da agricultura por caça e coleta.",
    ],
    respostaEsperada:
      "B. Expansão das fábricas e do uso de máquinas na produção.",
  }),
  curatedQuestion({
    id: "geo-em1-urbanizacao-01",
    componente: "Geografia",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Urbanização",
    tags: ["urbanizacao", "cidade", "geografia"],
    enunciado:
      "O crescimento acelerado das cidades sem planejamento pode gerar qual problema urbano?",
    alternativas: [
      "Ampliação automática de moradias adequadas para todos.",
      "Redução total da circulação de pessoas.",
      "Formação de áreas com infraestrutura precária.",
      "Fim das desigualdades socioespaciais.",
    ],
    respostaEsperada:
      "C. Formação de áreas com infraestrutura precária.",
  }),
  curatedQuestion({
    id: "fis-em1-energia-trabalho-01",
    componente: "Física",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Energia e trabalho",
    tags: ["energia", "trabalho", "fisica"],
    enunciado:
      "Na Física, trabalho mecânico ocorre quando uma força provoca:",
    alternativas: [
      "deslocamento no corpo na direção da força ou de sua componente",
      "aumento da massa do corpo sem movimento",
      "desaparecimento da energia",
      "mudança de cor sem interação",
    ],
    respostaEsperada:
      "A. deslocamento no corpo na direção da força ou de sua componente",
  }),
  curatedQuestion({
    id: "qui-em1-misturas-01",
    componente: "Química",
    anoSerie: "1ª série",
    etapa: "Ensino Médio",
    tema: "Misturas",
    tags: ["misturas", "quimica", "separacao"],
    enunciado:
      "Qual método é mais adequado para separar areia misturada com água?",
    alternativas: ["Filtração", "Destilação fracionada", "Imantação", "Evaporação do metal"],
    respostaEsperada: "A. Filtração",
  }),
];
