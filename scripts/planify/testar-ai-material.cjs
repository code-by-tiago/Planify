const endpoint = "http://localhost:3000/api/ai/material";

async function main() {
  const payload = {
    titulo: "Jogo pedagógico de revisão matemática",
    escola: "Escola Teste Planify",
    professor: "Tiago Souza",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componenteCurricular: "Matemática",
    tipo: "jogo",
    tema: "Operações com números naturais",
    quantidadeQuestoes: "",
    duracao: "1 período",
    objetivos:
      "Revisar operações matemáticas por meio de uma dinâmica colaborativa.",
    conteudos: [
      "Adição",
      "Subtração",
      "Multiplicação",
      "Divisão",
      "Resolução de problemas",
    ],
    orientacoes:
      "Organizar a turma em grupos, explicar as regras e conduzir a socialização das estratégias.",
    observacoes: "Material deve ser aplicável em sala e ter regras claras.",
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

  if (!json.data?.jogo) {
    console.error("O tipo jogo deve retornar o bloco jogo.");
    process.exit(1);
  }

  console.log("");
  console.log("OK: material didático gerado com IA.");
  console.log("OK: jogo pedagógico não exigiu quantidade de questões.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
