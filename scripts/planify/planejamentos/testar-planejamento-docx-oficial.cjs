const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const baseUrl = process.env.PLANIFY_URL || "http://localhost:3000";
  const outputDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(outputDir, { recursive: true });

  const habilidades = [
    {
      codigo: "EF05HI01",
      descricao:
        "Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.",
    },
    {
      codigo: "EF05HI02",
      descricao:
        "Identificar os mecanismos de organização do poder político com vistas à compreensão da ideia de Estado.",
    },
    {
      codigo: "EF05HI03",
      descricao:
        "Analisar o papel das culturas e das religiões na composição identitária dos povos antigos.",
    },
  ];

  function buildMatrix(conteudos, trimestre = 1) {
    return conteudos.map((conteudo, index) => ({
      conteudo,
      trimestre,
      aulaInicio: index * 2 + 1,
      aulaFim: index * 2 + 2,
      habilidades: [habilidades[index % habilidades.length]],
      objetivos: `Compreender ${conteudo.toLowerCase()} com leitura, análise e socialização em sala.`,
      metodologia:
        "Aula expositiva dialogada, leitura orientada, mapas e registros no caderno com mediação do professor.",
      recursos: "Livro didático, quadro, mapas, textos de apoio e caderno do estudante.",
      avaliacao: "Participação, resolução das atividades e produção escrita com critérios claros.",
      evidencias: "Registros escritos, mapas preenchidos e participação nas discussões em grupo.",
    }));
  }

  const conteudosAnual = [
    "Povos originários do Brasil",
    "Chegada dos portugueses e primeiros contatos",
    "Colonização e organização do território",
    "Cultura, memória e diversidade",
    "Fontes históricas e registros do passado",
    "Cidadania e participação social",
  ];

  const payloadAnual = {
    tipoPlanejamento: "anual",
    escola: "Escola Teste Planify",
    professor: "Professor(a) Teste",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    cargaHoraria: "60 aulas",
    temaCentral: "Formação histórica do Brasil",
    conteudos: conteudosAnual,
    habilidadesSelecionadas: habilidades,
    matrizPlanejamento: {
      tipoPlanejamento: "anual",
      titulo: "Planejamento anual — Formação histórica do Brasil",
      resumo: "Sequência anual com foco em culturas, colonização e cidadania.",
      conteudos: buildMatrix(conteudosAnual, 1),
    },
  };

  const conteudosTrimestral = [
    "Povos originários do Brasil",
    "Chegada dos portugueses e primeiros contatos",
    "Colonização e organização do território",
  ];

  const payloadTrimestral = {
    ...payloadAnual,
    tipoPlanejamento: "trimestral",
    trimestre: 1,
    cargaHoraria: "30 aulas",
    conteudos: conteudosTrimestral,
    matrizPlanejamento: {
      tipoPlanejamento: "trimestral",
      titulo: "Planejamento trimestral — 1º trimestre",
      resumo: "Sequência do trimestre com foco em formação histórica do Brasil.",
      conteudos: buildMatrix(conteudosTrimestral, 1),
    },
  };

  for (const [name, payload] of [
    ["planejamento-anual-oficial.docx", payloadAnual],
    ["planejamento-trimestral-oficial.docx", payloadTrimestral],
  ]) {
    const response = await fetch(`${baseUrl}/api/planejamentos/docx-oficial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(await response.text());
      throw new Error(`Falha ao gerar ${name}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const outputPath = path.join(outputDir, name);

    fs.writeFileSync(outputPath, buffer);
    console.log(`DOCX gerado: ${outputPath}`);
  }
}

main().catch((error) => {
  console.error("");
  console.error("Erro ao testar planejamento DOCX oficial:");
  console.error(error.message);
  process.exit(1);
});
