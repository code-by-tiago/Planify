import type { MaterialAIInput } from "../../../types/ai";

function normalizeConteudos(conteudos: MaterialAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) {
    return conteudos.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(conteudos)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function materialRulesByType(type: string): string[] {
  if (type === "atividade") {
    return [
      "Crie questões claras, progressivas e adequadas à série.",
      "Inclua enunciados completos.",
      "Inclua resposta esperada e critério de correção.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "prova") {
    return [
      "Crie uma avaliação organizada, com instruções e critérios.",
      "Inclua questões objetivas e discursivas quando fizer sentido.",
      "Inclua gabarito e critérios de correção.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "apostila") {
    return [
      "Crie explicação didática do conteúdo.",
      "Inclua exemplos e atividades ao final.",
      "Organize em seções curtas e objetivas.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "sequencia") {
    return [
      "Crie etapas de aula com início, desenvolvimento e fechamento.",
      "Inclua recursos, mediações e avaliação.",
      "Organize a progressão didática.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "jogo") {
    return [
      "Não crie quantidade de questões como requisito obrigatório.",
      "Preencha obrigatoriamente o bloco jogo.",
      "Crie nome do jogo, objetivo, materiais, preparação, regras e modo de jogar.",
      "Inclua variações e fechamento pedagógico.",
      "Se fizer sentido, inclua cartelas, comandos ou peças em formato textual pronto para impressão dentro das seções.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "projeto") {
    return [
      "Preencha obrigatoriamente o bloco projeto.",
      "Crie problema norteador, etapas, produto final e avaliação.",
      "Inclua investigação, produção e socialização.",
      "Organize o projeto de forma aplicável à escola.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "roteiro") {
    return [
      "Preencha obrigatoriamente o bloco roteiro.",
      "Crie roteiro de estudo com antes, durante e depois.",
      "Inclua tarefas de leitura, registro e autoavaliação.",
      "Organize linguagem autônoma para o aluno.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
    ];
  }

  return [
    "Crie material didático claro, profissional e aplicável.",
    "Organize em seções com instruções e critérios.",
    "Não preencha blocos específicos que não correspondam ao tipo solicitado.",
  ];
}

export function buildMaterialSystemInstruction(): string {
  return [
    "Você é uma IA pedagógica especialista em materiais didáticos brasileiros.",
    "Você trabalha para o SaaS Planify.",
    "Você deve gerar materiais didáticos completos, claros e aplicáveis.",
    "Você não deve inventar códigos BNCC.",
    "Nesta etapa, não crie DOCX.",
    "Preencha somente o bloco específico do tipo solicitado.",
    "Se o tipo não for jogo, o campo jogo deve ser null.",
    "Se o tipo não for projeto, o campo projeto deve ser null.",
    "Se o tipo não for roteiro, o campo roteiro deve ser null.",
    "Não inclua explicações fora do JSON.",
    "Não use markdown.",
    "Não use bloco de código.",
    "Retorne exclusivamente JSON válido.",
  ].join("\n");
}

export function buildMaterialPrompt(input: MaterialAIInput): string {
  const conteudos = normalizeConteudos(input.conteudos);
  const typeRules = materialRulesByType(input.tipo);

  return `
Gere um material didático profissional para o Planify.

DADOS:
Título: ${input.titulo}
Escola: ${input.escola || "Não informado"}
Professor: ${input.professor || "Não informado"}
Etapa: ${input.etapa}
Ano/Série: ${input.anoSerie}
Área do conhecimento: ${input.areaConhecimento || "Não informado"}
Componente curricular: ${input.componenteCurricular}
Tipo de material: ${input.tipo}
Tema: ${input.tema}
Quantidade de questões: ${input.quantidadeQuestoes || "Não se aplica ou não informado"}
Duração: ${input.duracao || "Não informado"}

CONTEÚDOS:
${conteudos.map((conteudo) => `- ${conteudo}`).join("\n")}

OBJETIVOS:
${input.objetivos || "Não informado"}

ORIENTAÇÕES:
${input.orientacoes || "Não informado"}

OBSERVAÇÕES:
${input.observacoes || "Não informado"}

REGRAS GERAIS:
1. O material deve ser adequado à etapa, ano/série e componente.
2. Use linguagem clara, pedagógica e profissional.
3. Não diga que é uma simulação.
4. Não gere DOCX.
5. Não invente códigos BNCC.
6. Se o tipo for jogo, não trate como prova nem atividade com quantidade obrigatória de questões.
7. Se o tipo for prova ou atividade, crie questões conforme a quantidade solicitada quando houver.
8. Se o tipo NÁO for jogo, retorne "jogo": null.
9. Se o tipo NÁO for projeto, retorne "projeto": null.
10. Se o tipo NÁO for roteiro, retorne "roteiro": null.
11. Retorne apenas JSON válido.

REGRAS ESPECÍFICAS DO TIPO:
${typeRules.map((rule) => `- ${rule}`).join("\n")}

FORMATO JSON EXATO:
{
  "titulo": "string",
  "subtitulo": "string",
  "tipo": "string",
  "resumo": "string",
  "dadosGerais": {
    "escola": "string",
    "professor": "string",
    "etapa": "string",
    "anoSerie": "string",
    "areaConhecimento": "string",
    "componenteCurricular": "string",
    "tema": "string",
    "duracao": "string"
  },
  "objetivos": ["string"],
  "conteudos": ["string"],
  "orientacoesProfessor": ["string"],
  "orientacoesAluno": ["string"],
  "introducao": "string",
  "secoes": [
    {
      "titulo": "string",
      "conteudo": "string",
      "itens": ["string"]
    }
  ],
  "questoes": [
    {
      "numero": 1,
      "tipo": "string",
      "enunciado": "string",
      "alternativas": ["string"],
      "respostaEsperada": "string",
      "criterioCorrecao": "string"
    }
  ],
  "jogo": null,
  "projeto": null,
  "roteiro": null,
  "criteriosAvaliacao": ["string"],
  "gabarito": ["string"],
  "adaptacoesInclusivas": ["string"],
  "sugestoesUso": ["string"],
  "alertas": ["string"]
}
`.trim();
}
