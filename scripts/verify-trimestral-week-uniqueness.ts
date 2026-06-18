/**
 * Verifica unicidade das semanas no trimestral (similaridade <= 70%).
 * Run: npx tsx scripts/verify-trimestral-week-uniqueness.ts
 */
import { generatePlanningFromBncc } from "../src/server/planejamentos/planning-matrix-engine";
import { computeTextSimilarity, SIMILARITY_THRESHOLD } from "../src/lib/planejamentos/planning-trimestral-similarity";

const payload = {
  tipoPlanejamento: "anual" as const,
  escola: "EE Demonstração Planify",
  professor: "Prof.ª Maria Silva",
  etapa: "Ensino Médio",
  anoSerie: "3ª série",
  turma: "3ª série A",
  areaConhecimento: "Linguagens e suas Tecnologias",
  componenteCurricular: "Língua Portuguesa",
  cargaHoraria: "160 períodos",
  conteudos: [
    "Leitura e interpretação de textos narrativos",
    "Produção textual: crônica e relato",
    "Gramática: regência verbal e nominal",
    "Literatura brasileira: modernismo",
  ].join("\n"),
  habilidadesSelecionadas: [
    { codigo: "EM13LP01", descricao: "Relacionar o texto.", conteudo: "Leitura" },
    { codigo: "EM13LP03", descricao: "Analisar intertextualidade.", conteudo: "Produção" },
    { codigo: "EM13LP05", descricao: "Planejar textos.", conteudo: "Gramática" },
    { codigo: "EM13LP10", descricao: "Analisar literatura.", conteudo: "Literatura" },
  ],
  modoMatrizBncc: true,
  trimestresNoPacote: [1],
};

const result = generatePlanningFromBncc(payload, [1]);
const trimPlan = result.package?.trimestrais[1];

if (!trimPlan) {
  throw new Error("Trimestral 1 ausente no pacote.");
}

const fields = ["metodologia", "materiais", "etapas", "evidencias", "instrumentos"] as const;
let maxSim = 0;
let failures = 0;

for (const item of trimPlan.conteudos) {
  const semanas = (item.semanas || []).filter((s) => s.etapas.trim());

  console.log(`\nAula ${item.numeroAula}: ${item.conteudo.slice(0, 50)} (${semanas.length} semanas ativas)`);

  for (const field of fields) {
    for (let i = 0; i < semanas.length; i += 1) {
      for (let j = i + 1; j < semanas.length; j += 1) {
        const a = String(semanas[i][field] || "");
        const b = String(semanas[j][field] || "");
        if (!a || !b) {
          continue;
        }
        const sim = computeTextSimilarity(a, b);
        maxSim = Math.max(maxSim, sim);
        if (sim > SIMILARITY_THRESHOLD) {
          console.error(
            `  FALHA: ${field} semana ${i + 1} vs ${j + 1} similaridade ${(sim * 100).toFixed(1)}%`,
          );
          failures += 1;
        }
      }
    }
  }

  if (semanas.length >= 2) {
    console.log(`  OK ${semanas.length} semanas com campos distintos`);
  }
}

console.log(`\nMax similaridade: ${(maxSim * 100).toFixed(1)}% (limite ${SIMILARITY_THRESHOLD * 100}%)`);

if (failures > 0) {
  process.exit(1);
}

console.log("OK: semanas do trimestral sem repetição acima do limite.");
