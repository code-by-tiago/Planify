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
  const normalizedType = String(type || "").trim().toLowerCase();

  if (normalizedType === "atividade") {
    return [
      "Entregue uma atividade escolar completa, não uma apostila, não uma prova e não um projeto.",
      "Organize aquecimento, desenvolvimento, prática, desafio e fechamento.",
      "Crie questões progressivas, contextualizadas e variadas: interpretação, associação, classificação, produção, justificativa, análise, aplicação e síntese.",
      "Inclua enunciados completos, exemplos suficientes, resposta esperada, critério de correção e orientações de aplicação.",
      "A versão do aluno deve ficar sem resposta logo abaixo da questão; o gabarito deve ficar separado.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "prova") {
    return [
      "Entregue uma avaliação escolar real, com instruções, distribuição equilibrada de dificuldade e critérios claros.",
      "Inclua questões objetivas com alternativas A-E quando fizer sentido, questões discursivas, questão contextualizada e questão de maior desafio.",
      "Não transforme a prova em apostila: explicações devem ser breves e apenas quando necessárias ao enunciado.",
      "Inclua gabarito comentado e critérios de correção por questão.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "lista") {
    return [
      "Entregue lista de exercícios progressiva, com blocos básico, intermediário e desafio.",
      "Crie prática suficiente para o aluno treinar de verdade, com comandos variados e contextualizados ao tema.",
      "Inclua gabarito comentado, critérios e indicação de erros comuns para retomada.",
      "Não transforme a lista em apostila longa; foco em prática organizada.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "revisao") {
    return [
      "Entregue revisão guiada, com síntese inicial, mapa mental textual, retomada dos conceitos, exercícios, desafio e autoavaliação.",
      "O material deve ajudar o aluno a lembrar, reorganizar e aplicar o conteúdo.",
      "Inclua gabarito comentado, pontos de atenção e sugestões de retomada para o professor.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "apostila") {
    return [
      "Entregue uma APOSTILA, não uma atividade solta, não uma prova e não uma sequência de aula.",
      "A apostila deve ter capa textual, apresentação, objetivos, capítulos/unidades, explicações consistentes, exemplos contextualizados, boxes de curiosidade, vocabulário, imagens ou infográficos sugeridos, exercícios de fixação, síntese final, glossário e referências/sugestões de aprofundamento adequadas ao nível escolar.",
      "Cada seção precisa ensinar o conteúdo antes de pedir exercício. Não comece com questões.",
      "Contextualize o tema ao componente curricular informado. Se o tema for Amazônia em Geografia, trabalhe território, biodiversidade, povos, economia, impactos ambientais, conservação e cidadania; não transforme em atividade de Língua Portuguesa. Se for Ciências, trate ecossistema, biodiversidade, ciclo da água e impactos. Se for História, trate ocupação, povos, conflitos e processos históricos.",
      "Use linguagem de apostila: explicativa, organizada, progressiva e adequada ao ano/série.",
      "Inclua exercícios apenas como bloco de prática ao final de unidades ou no fim da apostila, com gabarito separado.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "sequencia") {
    return [
      "Entregue sequência didática, não lista de questões.",
      "Organize aulas ou momentos com objetivos, tempo estimado, recursos, desenvolvimento, intervenção do professor, atividade do estudante, evidências e avaliação.",
      "Inclua progressão: sondagem, contextualização, desenvolvimento, prática, socialização, avaliação e retomada.",
      "Não preencha jogo, projeto nem roteiro.",
      "Não crie bloco de questões como estrutura principal.",
    ];
  }

  if (normalizedType === "jogo") {
    return [
      "Entregue um jogo pedagógico real, imprimível, editável e aplicável em sala de aula.",
      "Use exatamente o modelo de jogo solicitado: caça-palavras, cruzadinha, bingo, memória, dominó, quiz ou cartas.",
      "Inclua nome do jogo, objetivo, materiais, preparação, regras, modo de jogar, variações e fechamento pedagógico.",
      "Inclua material pronto para impressão: grades, cartelas, cartas, peças, pistas, perguntas, comandos ou banco de palavras conforme o modelo solicitado.",
      "Preencha jogoVisualSeed.termos com termos específicos do tema; cada termo deve ter resposta sem espaços e sem acentos, pista contextual e categoria.",
      "Inclua gabarito completo para o professor.",
      "Não entregue apenas regras. O jogo precisa conter peças, cartelas, perguntas, pistas ou grade pronta.",
      "Não preencha projeto nem roteiro.",
    ];
  }

  if (normalizedType === "projeto") {
    return [
      "Entregue projeto pedagógico completo, não atividade de exercícios.",
      "Preencha projeto com problema norteador, etapas, produto final e avaliação.",
      "As seções devem conter apresentação, justificativa, problema norteador, objetivos, metodologia, cronograma, etapas, produto final, socialização, avaliação e rubrica simples.",
      "Se houver tarefas, elas devem aparecer como etapas do projeto, roteiro de pesquisa ou orientação de produção, não como prova.",
      "O projeto deve ser aplicável à escola, com ações claras para professor e estudantes.",
      "Não preencha jogo nem roteiro.",
      "Não crie bloco de questões como estrutura principal.",
    ];
  }

  if (normalizedType === "roteiro") {
    return [
      "Entregue roteiro de estudo autônomo, não apostila e não prova.",
      "Preencha roteiro com antes do estudo, durante o estudo, depois do estudo e autoavaliação.",
      "Inclua leitura guiada, perguntas orientadoras, tarefas de registro, revisão e checagem de aprendizagem.",
      "Use linguagem direta para o aluno.",
      "Não preencha jogo nem projeto.",
    ];
  }

  return [
    "Crie material didático claro, profissional e aplicável.",
    "Organize em seções com instruções, prática e critérios.",
    "Não preencha blocos específicos que não correspondam ao tipo solicitado.",
  ];
}

export function buildMaterialSystemInstruction(): string {
  return [
    "Você é uma IA pedagógica especialista em materiais didáticos brasileiros para professores da Educação Básica.",
    "Você trabalha para o Planify, uma plataforma educacional premium.",
    "Sua prioridade absoluta é obedecer ao TIPO DE MATERIAL solicitado pelo professor.",
    "Nunca misture formatos: apostila ensina em capítulos; prova avalia; atividade pratica; lista treina; revisão retoma; sequência organiza aulas; projeto investiga e produz; roteiro orienta estudo; jogo entrega peças ou dinâmica pronta.",
    "O material deve ser adequado à etapa, ao ano/série, ao componente curricular e ao tema.",
    "Não transforme tema de Geografia, Ciências, História, Filosofia, Matemática ou Ensino Religioso em atividade de Língua Portuguesa, salvo se o componente escolhido for Língua Portuguesa, Redação ou Escrita Criativa.",
    "Aprofunde o conteúdo com linguagem escolar, exemplos, contextualização, progressão e aplicabilidade real em sala.",
    "Para temas amplos, delimite em unidades coerentes sem fugir do tema central.",
    "A versão do aluno deve conter comandos e espaços de resposta, mas não deve revelar respostas logo abaixo das questões.",
    "O gabarito, respostas esperadas e critérios devem ficar separados para o professor.",
    "Não invente códigos BNCC.",
    "Não crie DOCX nesta etapa.",
    "Não exponha termos de bastidor como motor, prompt, JSON, fallback, regra interna, IA, validação técnica ou critérios do sistema dentro do material.",
    "Se o tipo não for jogo, retorne jogo como null ou omita conteúdo real desse bloco.",
    "Se o tipo não for projeto, retorne projeto como null ou omita conteúdo real desse bloco.",
    "Se o tipo não for roteiro, retorne roteiro como null ou omita conteúdo real desse bloco.",
    "Retorne exclusivamente JSON válido, sem markdown e sem bloco de código.",
  ].join("\n");
}

export function buildMaterialPrompt(input: MaterialAIInput): string {
  const conteudos = normalizeConteudos(input.conteudos);
  const typeRules = materialRulesByType(input.tipo);

  return `
Gere um material didático profissional para o Planify.

DADOS DO PROFESSOR E DA TURMA:
Título: ${input.titulo || "Não informado"}
Escola: ${input.escola || "Não informado"}
Professor: ${input.professor || "Não informado"}
Etapa: ${input.etapa}
Ano/Série: ${input.anoSerie}
Área do conhecimento: ${input.areaConhecimento || "Não informado"}
Componente curricular: ${input.componenteCurricular}
Tipo de material: ${input.tipo}
Modelo de jogo, se houver: ${input.modeloJogo || "Não se aplica"}
Tema central: ${input.tema}
Quantidade de questões: ${input.quantidadeQuestoes || "Não se aplica ou não informado"}
Duração/tempo estimado: ${input.duracao || "Não informado"}
Finalidade de uso: ${input.finalidade || "Não informado"}
Nível de aprofundamento: ${input.nivelAprofundamento || "Completo"}
Contexto da turma/dificuldades: ${input.contextoTurma || "Não informado"}
Recursos disponíveis: ${input.recursosDisponiveis || "Não informado"}
Critérios personalizados de avaliação: ${input.criteriosAvaliacaoPersonalizados || "Não informado"}

CONTEÚDOS SELECIONADOS:
${conteudos.length ? conteudos.map((conteudo) => `- ${conteudo}`).join("\n") : "- Use o tema central para organizar os conteúdos essenciais."}

OBJETIVOS INFORMADOS PELO PROFESSOR:
${input.objetivos || "Não informado"}

ORIENTAÇÕES DO PROFESSOR:
${input.orientacoes || "Não informado"}

OBSERVAÇÕES:
${input.observacoes || "Não informado"}

REGRAS UNIVERSAIS:
1. O material deve obedecer exatamente ao tipo selecionado.
2. O conteúdo deve ser profundo, coerente, aplicável, sem repetição e sem encher espaço com frases genéricas.
3. Nunca crie material raso com apenas comandos soltos.
4. Nunca copie a mesma pergunta com pequenas mudanças.
5. Integre todos os conteúdos selecionados em um único material coerente.
6. Se o professor informou contexto da turma, recursos, finalidade, critérios ou observações, use isso para personalizar o material.
7. Se o tipo for apostila, explique antes de exercitar e organize em capítulos/unidades.
8. Se o tipo for prova, avalie sem virar apostila.
9. Se o tipo for atividade, proponha prática orientada sem virar prova formal.
10. Se o tipo for projeto, use etapas de investigação e produto final, não lista de exercícios.
11. Se o tipo for sequência, organize aulas/momentos, não questões.
12. Se o tipo for jogo, entregue material visual/prático pronto para uso.
13. Use linguagem adequada ao ano/série, sem infantilizar turma avançada e sem complexidade excessiva para anos iniciais.
14. Respeite o componente curricular: Geografia deve ter raciocínio espacial/territorial; Ciências deve ter investigação científica; História deve ter processos históricos; Matemática deve ter resolução e procedimentos; Línguas devem trabalhar linguagem; Ensino Religioso deve tratar valores e diversidade com respeito.
15. Retorne apenas JSON válido.

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
  "alertas": [],
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
