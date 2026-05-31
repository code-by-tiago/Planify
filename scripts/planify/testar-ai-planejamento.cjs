const endpoint = "http://localhost:3000/api/ai/planejamento";

async function main() {
  const payload = {
    escola: "Escola Teste Planify",
    professor: "Tiago Souza",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: "80 períodos",
    tipo: "anual",
    trimestre: "",
    conteudos: [
      "Leitura e interpretação de textos",
      "Produção textual",
      "Pontuação",
    ],
    objetivos: "Desenvolver leitura, interpretação e produção escrita.",
    observacoes: "Turma com foco em reforço de leitura.",
    habilidadesSelecionadas: [
      {
        codigo: "EF15LP01",
        habilidade:
          "Identificar a função social de textos que circulam em campos da vida social dos quais participa cotidianamente.",
        componente: "Língua Portuguesa",
        etapa: "Ensino Fundamental",
        anoSerie: "1º ao 5º ano",
      },
      {
        codigo: "EF35LP03",
        habilidade:
          "Identificar a ideia central do texto, demonstrando compreensão global.",
        componente: "Língua Portuguesa",
        etapa: "Ensino Fundamental",
        anoSerie: "3º ao 5º ano",
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  console.log(JSON.stringify(json, null, 2));

  if (!response.ok || json.success === false) {
    process.exit(1);
  }

  const etapas = json.data?.etapas || [];
  const primeiraEtapa = etapas[0];

  if (!primeiraEtapa) {
    console.error("Nenhuma etapa retornada.");
    process.exit(1);
  }

  if (!Array.isArray(primeiraEtapa.habilidadesBnccCodigos)) {
    console.error("Campo habilidadesBnccCodigos não retornou como array.");
    process.exit(1);
  }

  if (!Array.isArray(primeiraEtapa.habilidadesBncc)) {
    console.error("Campo habilidadesBncc não retornou como array.");
    process.exit(1);
  }

  const temDescricaoOficial = primeiraEtapa.habilidadesBncc.some((item) =>
    String(item).includes(" — "),
  );

  if (!temDescricaoOficial) {
    console.error("As habilidades da etapa não vieram com código + descrição oficial.");
    process.exit(1);
  }

  console.log("");
  console.log("OK: habilidadesBnccCodigos = códigos puros.");
  console.log("OK: habilidadesBncc = código + descrição oficial para tabela/DOCX.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
