import type { MaterialAIOutput, PlanejamentoAIOutput } from "../../types/ai";

function list(items: string[] | undefined): string {
  if (!items || items.length === 0) {
    return "";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function section(title: string, content: string): string {
  if (!content.trim()) {
    return "";
  }

  return `## ${title}\n\n${content.trim()}`;
}

function listSection(title: string, items: string[] | undefined): string {
  const content = list(items);

  if (!content) {
    return "";
  }

  return `## ${title}\n\n${content}`;
}

function isJogoMaterial(material: MaterialAIOutput): boolean {
  return String(material.tipo || "").toLowerCase() === "jogo";
}

function isProjetoMaterial(material: MaterialAIOutput): boolean {
  return String(material.tipo || "").toLowerCase() === "projeto";
}

function isRoteiroMaterial(material: MaterialAIOutput): boolean {
  return String(material.tipo || "").toLowerCase() === "roteiro";
}

export function formatPlanejamentoForEditor(plan: PlanejamentoAIOutput): string {
  const parts: string[] = [];

  parts.push(`# ${plan.titulo}`);
  parts.push(plan.resumo);

  parts.push(
    [
      "## Dados gerais",
      "",
      `Escola: ${plan.dadosGerais.escola}`,
      `Professor: ${plan.dadosGerais.professor}`,
      `Etapa: ${plan.dadosGerais.etapa}`,
      `Ano/Série: ${plan.dadosGerais.anoSerie}`,
      `Componente curricular: ${plan.dadosGerais.componenteCurricular}`,
      `Carga horária: ${plan.dadosGerais.cargaHoraria}`,
      `Tipo: ${plan.dadosGerais.tipo}`,
      plan.dadosGerais.trimestre ? `Trimestre: ${plan.dadosGerais.trimestre}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  parts.push(listSection("Objetivos gerais", plan.objetivosGerais));
  parts.push(listSection("Conteúdos organizados", plan.conteudosOrganizados));
  parts.push(section("Metodologia geral", plan.metodologiaGeral));
  parts.push(section("Avaliação geral", plan.avaliacaoGeral));
  parts.push(listSection("Recursos gerais", plan.recursosGerais));
  parts.push(listSection("Evidências de aprendizagem", plan.evidenciasDeAprendizagem));

  if (plan.etapas.length > 0) {
    parts.push("## Etapas do planejamento");

    for (const [index, etapa] of plan.etapas.entries()) {
      parts.push(
        [
          `### Etapa ${index + 1} — ${etapa.titulo}`,
          "",
          etapa.descricao,
          "",
          "Conteúdos:",
          list(etapa.conteudos),
          "",
          "Habilidades BNCC para tabela/DOCX:",
          list(etapa.habilidadesBncc),
          "",
          "Metodologia:",
          etapa.metodologia,
          "",
          "Recursos:",
          list(etapa.recursos),
          "",
          "Avaliação:",
          etapa.avaliacao,
          "",
          "Evidências:",
          list(etapa.evidencias),
        ].join("\n"),
      );
    }
  }

  parts.push(listSection("Observações pedagógicas", plan.observacoesPedagogicas));
  parts.push(listSection("Próximos passos", plan.proximosPassos));

  if (plan.alertas.length > 0) {
    parts.push(listSection("Alertas internos", plan.alertas));
  }

  return parts.filter((part) => part.trim()).join("\n\n");
}

export function formatMaterialForEditor(material: MaterialAIOutput): string {
  const parts: string[] = [];

  parts.push(`# ${material.titulo}`);

  if (material.subtitulo) {
    parts.push(`_${material.subtitulo}_`);
  }

  parts.push(material.resumo);

  parts.push(
    [
      "## Dados gerais",
      "",
      material.dadosGerais.escola ? `Escola: ${material.dadosGerais.escola}` : "",
      material.dadosGerais.professor ? `Professor: ${material.dadosGerais.professor}` : "",
      `Etapa: ${material.dadosGerais.etapa}`,
      `Ano/Série: ${material.dadosGerais.anoSerie}`,
      material.dadosGerais.areaConhecimento
        ? `Área do conhecimento: ${material.dadosGerais.areaConhecimento}`
        : "",
      `Componente curricular: ${material.dadosGerais.componenteCurricular}`,
      `Tema: ${material.dadosGerais.tema}`,
      material.dadosGerais.duracao ? `Duração: ${material.dadosGerais.duracao}` : "",
      `Tipo: ${material.tipo}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  parts.push(listSection("Objetivos", material.objetivos));
  parts.push(listSection("Conteúdos", material.conteudos));
  parts.push(listSection("Orientações ao professor", material.orientacoesProfessor));
  parts.push(listSection("Orientações ao aluno", material.orientacoesAluno));
  parts.push(section("Introdução", material.introducao));

  if ((material.secoes || []).length > 0) {
    parts.push("## Seções");

    for (const [index, secao] of (material.secoes || []).entries()) {
      parts.push(
        [
          `### ${index + 1}. ${secao.titulo}`,
          "",
          secao.conteudo,
          secao.itens.length > 0 ? "\nItens:" : "",
          list(secao.itens),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  if ((material.questoes || []).length > 0) {
    parts.push("## Questões");

    for (const question of (material.questoes || [])) {
      parts.push(
        [
          `### Questão ${question.numero}`,
          "",
          question.enunciado,
          question.alternativas.length > 0 ? "\nAlternativas:" : "",
          list(question.alternativas),
          "",
          `Resposta esperada: ${question.respostaEsperada}`,
          `Critério de correção: ${question.criterioCorrecao}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  if (isJogoMaterial(material) && material.jogo) {
    parts.push(
      [
        "## Jogo pedagógico",
        "",
        `Nome: ${material.jogo.nome}`,
        material.jogo.tipoJogo ? `Modelo: ${material.jogo.tipoJogo}` : "",
        "",
        `Objetivo: ${material.jogo.objetivo}`,
        "",
        "Materiais:",
        list(material.jogo.materiais),
        "",
        "Preparação:",
        list(material.jogo.preparacao),
        "",
        "Regras:",
        list(material.jogo.regras),
        "",
        "Modo de jogar:",
        list(material.jogo.modoDeJogar),
        "",
        "Variações:",
        list(material.jogo.variacoes),
        "",
        `Fechamento: ${material.jogo.fechamento}`,
      ].join("\n"),
    );
  }

  if (isProjetoMaterial(material) && material.projeto) {
    parts.push(
      [
        "## Projeto",
        "",
        `Problema norteador: ${material.projeto.problemaNorteador}`,
        "",
        "Etapas:",
        list(material.projeto.etapas),
        "",
        `Produto final: ${material.projeto.produtoFinal}`,
        "",
        `Avaliação: ${material.projeto.avaliacao}`,
      ].join("\n"),
    );
  }

  if (isRoteiroMaterial(material) && material.roteiro) {
    parts.push(
      [
        "## Roteiro de estudo",
        "",
        "Antes do estudo:",
        list(material.roteiro.antesDoEstudo),
        "",
        "Durante o estudo:",
        list(material.roteiro.duranteOEstudo),
        "",
        "Depois do estudo:",
        list(material.roteiro.depoisDoEstudo),
        "",
        "Autoavaliação:",
        list(material.roteiro.autoavaliacao),
      ].join("\n"),
    );
  }

  parts.push(listSection("Critérios de avaliação", material.criteriosAvaliacao || []));
  parts.push(listSection("Gabarito", material.gabarito || []));
  parts.push(listSection("Adaptações inclusivas", material.adaptacoesInclusivas || []));
  parts.push(listSection("Sugestões de uso", material.sugestoesUso || []));

  if ((material.alertas || []).length > 0) {
    parts.push(listSection("Alertas internos", material.alertas || []));
  }

  return parts.filter((part) => part.trim()).join("\n\n");
}
