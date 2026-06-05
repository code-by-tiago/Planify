import type { MaterialAIInput } from "../../../types/ai";
import { buildSpecialistPromptBlock } from "../../../lib/materiais/material-specialist-blueprints";
import { buildMaterialStructureContract } from "../../../lib/materiais/material-structure-contracts";
import { buildPedagogicalReferenceKernelPrompt } from "../../../lib/materiais/material-pedagogical-reference-kernel";
import { buildKnowledgeEnginePrompt } from "../../../lib/materiais/material-knowledge-engine";

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
      "Não comece com apresentação longa. Entregue a VERSÃO DO ALUNO diretamente, com cabeçalho, comandos e questões.",
      "Depois entregue GABARITO DO PROFESSOR separado, com respostas esperadas e critérios.",
      "Organize aquecimento, desenvolvimento, prática, desafio e fechamento apenas dentro dos comandos, sem texto explicativo antes do material.",
      "Crie questões progressivas, contextualizadas e variadas: identificação, classificação, reescrita, interpretação, associação, produção, justificativa, análise, aplicação e síntese.",
      "Não compacte várias letras a), b), c), d) dentro de uma única questão. Cada pergunta principal deve ser uma questão própria no array questoes.",
      "Inclua enunciados completos, exemplos suficientes, resposta esperada, critério de correção e comandos de aplicação.",
      "Se a questão pedir classificar, identificar ou analisar várias frases, apresente as frases em tópicos com • e não no mesmo parágrafo do comando.",
      "A versão do aluno deve ficar sem resposta logo abaixo da questão; o gabarito deve ficar separado.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "prova") {
    return [
      "Entregue uma avaliação escolar real pronta para aplicar, começando por cabeçalho, instruções breves e questões.",
      "Não escreva justificativa pedagógica antes da prova. O professor quer a prova pronta.",
      "Inclua questões objetivas com alternativas A-E quando fizer sentido, questões discursivas, questão contextualizada e questão de maior desafio.",
      "Não transforme a prova em apostila: explicações devem ser breves e apenas quando necessárias ao enunciado.",
      "Inclua gabarito comentado e critérios de correção por questão.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "lista") {
    return [
      "Entregue lista de exercícios progressiva pronta para o aluno resolver, sem introdução longa.",
      "Separe VERSÃO DO ALUNO e GABARITO DO PROFESSOR.",
      "Crie prática suficiente para o aluno treinar de verdade, com comandos variados e contextualizados ao tema.",
      "Não entregue exercícios em forma de parágrafo. Cada exercício deve ser item numerado, com comando próprio e espaço de resposta.",
      "Inclua gabarito comentado, critérios e indicação de erros comuns para retomada.",
      "Não transforme a lista em apostila longa; foco em prática organizada.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "revisao") {
    return [
      "Entregue revisão guiada objetiva, com síntese curta e foco em exercícios, retomada e gabarito.",
      "Não escreva apresentação longa antes da revisão.",
      "O material deve ajudar o aluno a lembrar, reorganizar e aplicar o conteúdo.",
      "Inclua gabarito comentado, pontos de atenção e sugestões de retomada para o professor.",
      "Não preencha jogo, projeto nem roteiro.",
    ];
  }

  if (normalizedType === "apostila") {
    return [
      "Entregue uma APOSTILA pronta, não uma atividade solta, não uma prova e não uma sequência de aula.",
      "A apostila pode ter apresentação, mas deve ser curta e ir rápido ao conteúdo.",
      "A apostila deve ter capa textual, apresentação, objetivos, capítulos/unidades, explicações consistentes, exemplos contextualizados, boxes de curiosidade, vocabulário, imagens ou infográficos sugeridos, exercícios de fixação, síntese final, glossário e referências/sugestões de aprofundamento adequadas ao nível escolar.",
      "Se houver quantidade de questões/exercícios informada, entregue EXATAMENTE essa quantidade no array questoes e no gabarito separado.",
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
      "Use exatamente o modelo de jogo solicitado: caça-palavras, cruzadinha, bingo, memória, dominó, quiz, cartas ou trilha pedagógica.",
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

  if (normalizedType === "plano-aula" || normalizedType === "plano aula") {
    return [
      "Entregue plano de aula completo, não lista de exercícios.",
      "Organize etapas cronológicas com tempo estimado, recursos e ações do professor e dos estudantes.",
      "Referencie competências e habilidades da BNCC quando coerentes com componente e ano/série.",
      "Inclua objetivos, avaliação formativa e adaptações.",
      "Não preencha jogo, projeto nem bloco principal de questões.",
    ];
  }

  if (normalizedType === "redacao") {
    return [
      "Entregue proposta de redação para produção textual (não corrija redação já escrita).",
      "Inclua tema, gênero textual, comando e textos motivadores na quantidade solicitada.",
      "Cada motivador deve estar em seção própria com título que identifique o texto.",
      "Inclua critérios de avaliação e competências em criteriosAvaliacao.",
      "Se o professor pediu gabarito, inclua redação modelo no array gabarito; caso contrário, omita modelo.",
      "Não preencha questoes como lista de exercícios.",
    ];
  }

  if (normalizedType === "resumo") {
    return [
      "Entregue resumo guiado por seções temáticas com bullets objetivos.",
      "Organize a quantidade de blocos/seções solicitada pelo professor.",
      "Inclua revisão, fixação ou perguntas de checagem ao final.",
      "Não transformar em apostila longa nem em prova.",
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
    "Sua segunda prioridade é entregar o produto pronto, sem preâmbulo, sem justificativa longa e sem explicar o que você vai fazer antes de entregar.",
    "Para atividade, prova, lista, revisão e exercícios, a entrega deve começar pelo material utilizável: VERSÃO DO ALUNO e depois GABARITO DO PROFESSOR.",
    "Atividade, lista, prova e revisão devem ter forma de folha escolar: questões numeradas, comandos diretos, tópicos, alternativas ou espaço de resposta. Não entregue como textão.",
    "Nunca cole exemplos, frases ou itens de análise no mesmo parágrafo do título da questão. Separe comando e itens em linhas com • quando houver mais de uma frase para analisar.",
    "Cada gabarito deve trazer resposta esperada real e suficiente; não use gabarito pobre como 'resposta pessoal' sem critérios ou exemplos aceitáveis.",
    "Nunca misture formatos: apostila ensina em capítulos; prova avalia; atividade pratica; lista treina; revisão retoma; sequência organiza aulas; projeto investiga e produz; roteiro orienta estudo; jogo entrega peças ou dinâmica pronta.",
    "O material deve ser adequado à etapa, ao ano/série, ao componente curricular e ao tema.",
    "Use padrões pedagógicos reais e fontes educacionais confiáveis como referência estrutural, mas produza conteúdo original do Planify, sem copiar textos, questões ou apostilas da web.",
    "Trate a web como fonte de conhecimento e curadoria, não como banco de cópia; respeite licença, domínio público e autoria.",
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
  const specialistBlock = buildSpecialistPromptBlock(input);
  const structureContract = buildMaterialStructureContract(input);
  const referenceKernel = buildPedagogicalReferenceKernelPrompt(input);
  const knowledgeEngine = buildKnowledgeEnginePrompt(input);

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

CONTRATO DE ESPECIALISTA PLANIFY:
${specialistBlock}

CONTRATO DE ESTRUTURA VISUAL E PEDAGÓGICA:
${structureContract}

BASE PEDAGÓGICA ESPECIALISTA PLANIFY:
${referenceKernel}

${knowledgeEngine}

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
14. CONTRATO DE PRECISÃO: quando houver quantidade informada, o array questoes deve conter exatamente essa quantidade, sem uma a menos, sem uma a mais. Se o professor pedir 10 questões, entregue 10 objetos numerados de 1 a 10 e 10 itens correspondentes no gabarito.
15. Cada questão deve ter enunciado completo, comando claro, resposta esperada e critério de correção. Provas devem combinar objetivas e discursivas quando fizer sentido.
16. Não compacte várias perguntas em uma só questão com a), b), c), d). Se existirem 10 itens pedidos, crie 10 objetos em questoes.
17. Não deixe promessa solta no texto: se disser “responda às questões abaixo”, as questões precisam existir logo no bloco próprio.
18. Respeite o componente curricular: Geografia deve ter raciocínio espacial/territorial; Ciências deve ter investigação científica; História deve ter processos históricos; Matemática deve ter resolução e procedimentos; Línguas devem trabalhar linguagem; Ensino Religioso deve tratar valores e diversidade com respeito.
19. Retorne apenas JSON válido.
20. Antes de finalizar, faça uma checagem interna: tipo correto, todos os conteúdos usados, quantidade exata de questões, gabarito correspondente, seções completas e nenhuma promessa sem entrega.
21. O material deve parecer produto editorial escolar: estrutura limpa, títulos úteis, itens separados, espaços de resposta e gabarito rico; não entregue parágrafos colados nem blocos improvisados.
22. O material deve ser original. Use padrões pedagógicos reconhecidos como referência, mas não copie textos de fontes externas.

REGRAS ESPECÍFICAS DO TIPO:
${typeRules.map((rule) => `- ${rule}`).join("\n")}

CONTRATO DE ENTREGA DIRETA AO PRODUTO:
- Não escreva frases de abertura como "Este material foi elaborado", "A seguir", "Apresento", "Objetivo deste material" ou justificativas pedagógicas antes do produto.
- Para atividade, prova, lista, revisão e exercícios: coloque o material em formato direto, com questões no array questoes e gabarito separado no array gabarito.
- Atividades, exercícios e listas não podem vir como parágrafo corrido dentro de secoes. Devem vir como itens numerados no array questoes.
- Não use uma questão com vários itens a), b), c), d) para simular quantidade. Cada pergunta principal deve ser objeto próprio.
- Quando uma questão pedir análise de várias frases, exemplos, situações ou alternativas curtas, separe assim: primeira linha com o COMANDO; linhas seguintes com "• item 1", "• item 2", "• item 3".
- Nunca emende exemplos no título ou no comando da questão. O comando deve ficar separado dos itens que o aluno analisará.
- Quando um enunciado tiver mais de uma ação, organize em tópicos curtos usando linhas com "•".
- A versão do aluno nunca deve revelar resposta logo abaixo da questão.
- O gabarito do professor deve ser completo, coerente com as questões finais e separado. Para cada questão, traga resposta esperada, exemplos aceitáveis quando houver resposta aberta e critério de correção.
- Se o professor pedir quantidade de questões, isso é contrato: entregar exatamente a quantidade solicitada.
- Use orientacoesProfessor, orientacoesAluno, sugestoesUso e adaptacoesInclusivas apenas como notas finais curtas, nunca como parte principal antes das questões.

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
      "enunciado": "string em formato objetivo; uma pergunta principal por objeto; se houver várias frases para análise, use primeira linha como comando e linhas seguintes com • para cada item",
      "alternativas": ["string"],
      "respostaEsperada": "string com resposta esperada completa, exemplos aceitáveis quando houver resposta aberta e orientação objetiva para correção",
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
