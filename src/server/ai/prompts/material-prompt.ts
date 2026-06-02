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
      "Crie questões claras, progressivas e adequadas à série, em padrão de livro de atividades.",
      "Cada questão deve ser ampla: use itens internos com letras a até j sempre que fizer sentido, trazendo muitos exemplos e situações para prática.",
      "Varie comandos: lacunas, classificação, relação, reescrita, interpretação, justificativa, aplicação e desafio.",
      "Inclua enunciados completos, vários exemplos, itens de a até j quando aplicável, espaço de resposta quando aplicável e progressão básico-intermediário-desafio.",
      "Inclua resposta esperada e critério de correção.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "prova") {
    return [
      "Crie uma avaliação organizada, com instruções e critérios, semelhante a prova escolar real.",
      "Inclua questões objetivas com alternativas A-E, discursivas, contextualizadas, itens internos com letras e pelo menos uma questão desafio quando fizer sentido.",
      "Inclua gabarito e critérios de correção.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "lista") {
    return [
      "Crie lista de exercícios com progressão básico, intermediário e desafio, com questões amplas e vários itens internos de a até j.",
      "Use comandos variados em padrão de livro de atividades: complete, relacione, classifique, reescreva, resolva, interprete e justifique, sempre com muitos exemplos práticos.",
      "Inclua gabarito comentado e critérios de correção.",
      "Não preencha o bloco jogo.",
      "Não preencha o bloco projeto.",
      "Não preencha o bloco roteiro.",
    ];
  }

  if (type === "revisao") {
    return [
      "Crie revisão guiada com síntese, retomada, exercícios de fixação com muitos itens, desafio e autoavaliação.",
      "Use linguagem clara para aluno e orientações de correção para professor.",
      "Inclua gabarito comentado e pontos de atenção.",
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
      "Crie um jogo pedagógico real, imprimível, editável e aplicável em sala de aula.",
      "Use exatamente o modelo de jogo solicitado: caça-palavras, cruzadinha, bingo pedagógico, jogo da memória, dominó pedagógico, quiz com gabarito ou cartas recortáveis.",
      "Inclua nome do jogo, tipoJogo, objetivo, materiais, preparação, regras, modo de jogar, variações e fechamento pedagógico.",
      "Inclua nas seções o material pronto para impressão: grades, cartelas, cartas, peças, pistas, perguntas, comandos ou banco de palavras conforme o modelo solicitado.",
      "Para jogo, preencha também jogoVisualSeed.termos com termos específicos do tema: cada item deve ter termo, resposta sem espaços, pista sem entregar a resposta e categoria.",
      "As pistas devem ter nexo com o tema informado pelo professor. Exemplo: se o tema for Jó, use termos como Jó, paciência, fidelidade, sofrimento, provação, esperança e integridade, com pistas bíblico-pedagógicas coerentes.",
      "Inclua gabarito completo para o professor.",
      "Não entregue uma página vazia, genérica ou apenas com regras. O jogo precisa conter peças/conteúdo pronto para uso.",
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
    "Você trabalha para o Planify, uma plataforma educacional premium para professores.",
    "Você deve gerar materiais didáticos completos, claros, aplicáveis, visualmente organizados e com padrão de livro de atividades.",
    "Regra central universal: para qualquer componente curricular, trate o tema como um conteúdo completo. Não transforme subconteúdos em materiais separados; integre todos os blocos essenciais em uma única atividade/prova/lista/revisão/jogo coerente, profunda e pronta para uso.",
    "Para atividades, provas, listas e revisões, gere exercícios originais ricos, com comandos variados: complete, classifique, relacione, reescreva, interprete, justifique, resolva e produza.",
    "Regra de profundidade: exercícios não podem ser pobres. Sempre que possível, cada questão deve trazer vários itens internos com letras a, b, c, d, e, f, g, h, i e j, com exemplos, frases, situações, alternativas ou subcomandos.",
    "Provas devem ter questões objetivas com alternativas A, B, C, D e E quando aplicável, além de questões discursivas com itens internos.",
    "A versão do aluno deve conter questões sem respostas logo abaixo; o gabarito comentado deve ficar separado na versão do professor.",
    "Todo material avaliativo deve ter versão do aluno, versão do professor, gabarito comentado, critérios de correção e aparência organizada para impressão.",
    "Você não deve inventar códigos BNCC.",
    "Nesta etapa, não crie DOCX.",
    "Preencha somente o bloco específico do tipo solicitado.",
    "Se o tipo não for jogo, o campo jogo deve ser null.",
    "Quando o tipo for jogo, gere um material realmente imprimível, com peças/cartelas/pistas/perguntas e gabarito.",
    "Quando o tipo for jogo, gere banco semântico contextual em jogoVisualSeed.termos. Esse banco será usado pelo motor visual do Planify para montar cruzadinha, caça-palavras, bingo, memória, dominó, quiz e cartas.",
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
Modelo de jogo, se houver: ${input.modeloJogo || "Não se aplica"}
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
7. Se o tipo for jogo, use o modelo informado e entregue material pronto para imprimir, recortar quando necessário, aplicar e corrigir.
8. Se o tipo for prova, atividade, lista ou revisão, crie questões conforme a quantidade solicitada, com variedade de comandos, itens internos de a até j quando aplicável, exemplos amplos, gabarito comentado e critérios.
9. Integre todos os conteúdos listados em um único material. Esta regra vale para TODAS as disciplinas: se o tema for sujeito, aborde todos os tipos de sujeito no mesmo material; se for frações, aborde conceito, comparação, operações e problemas no mesmo material; se for Redação, aborde tese, argumentos, repertório, coesão e reescrita no mesmo material; se for Espanhol, aborde vocabulário, leitura, diálogo, cultura e produção no mesmo material. Nunca crie uma atividade isolada para cada subtópico.
10. Organize o material em blocos internos progressivos: retomada, explicação curta, exercícios guiados, exercícios mistos, desafio e gabarito comentado. A versão do aluno não deve exibir resposta logo abaixo das questões; respostas devem aparecer no gabarito do professor.
11. Se o tipo NÃO for jogo, retorne "jogo": null.
12. Se o tipo NÃO for projeto, retorne "projeto": null.
13. Se o tipo NÃO for roteiro, retorne "roteiro": null.
14. Retorne apenas JSON válido.
15. Evite questões pobres com poucos exemplos. Para materiais de exercício, o padrão mínimo recomendado é ter itens internos com letras a, b, c, d, e, f, g, h, i e j sempre que a disciplina permitir.

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
  "jogo": {
    "nome": "string",
    "tipoJogo": "string",
    "objetivo": "string",
    "materiais": ["string"],
    "preparacao": ["string"],
    "regras": ["string"],
    "modoDeJogar": ["string"],
    "variacoes": ["string"],
    "fechamento": "string"
  },
  "projeto": null,
  "roteiro": null,
  "criteriosAvaliacao": ["string"],
  "gabarito": ["string"],
  "adaptacoesInclusivas": ["string"],
  "sugestoesUso": ["string"],
  "alertas": ["string"],
  "jogoVisualSeed": {
    "termos": [
      {
        "termo": "string",
        "resposta": "PALAVRASEMACENTOSEMESPACOS",
        "pista": "string sem entregar a resposta",
        "categoria": "string"
      }
    ]
  }
}
`.trim();
}
