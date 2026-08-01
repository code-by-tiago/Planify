async function main() {
  const baseUrl = process.env.PLANIFY_URL || "http://localhost:3000";

  const payload = {
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    areaConhecimento: "Linguagens e suas Tecnologias",
    componenteCurricular: "Língua Portuguesa",
    conteudos: [
      "Tipos de texto: descrição, narração e dissertação",
      "Estrutura Dissertativa-Argumentativa: introdução com tese, desenvolvimento e conclusão",
      "Competências do ENEM: domínio da norma padrão e proposta de intervenção detalhada",
      "Repertório Sociocultural: uso de dados, filosofia, história e literatura nos argumentos",
    ],
  };

  const response = await fetch(`${baseUrl}/api/bncc/sugerir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  console.log(JSON.stringify(result, null, 2));

  if (!response.ok || !result.success || !Array.isArray(result.habilidades)) {
    throw new Error("Falha ao sugerir habilidades BNCC.");
  }

  if (result.habilidades.length === 0) {
    throw new Error("Nenhuma habilidade foi sugerida.");
  }

  console.log("");
  console.log(`OK: ${result.habilidades.length} habilidades sugeridas.`);
}

main().catch((error) => {
  console.error("");
  console.error("Erro no teste BNCC por conteúdo:");
  console.error(error.message);
  process.exit(1);
});
