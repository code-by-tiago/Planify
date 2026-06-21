/**
 * Verifica o motor determinístico de planejamento (sem IA).
 * Run: npx tsx scripts/verify-planning-matrix-engine.ts
 */
import assert from "node:assert/strict";
import { generatePlanningFromBncc } from "../src/server/planejamentos/planning-matrix-engine";
import type { PlanningAiPayload } from "../src/server/planejamentos/planning-ai-service";

function buildPayload(): PlanningAiPayload {
  return {
    tipoPlanejamento: "anual",
    escola: "Escola Motor",
    professor: "Prof. Motor",
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: "80 períodos",
    conteudos: [
      "Leitura e interpretação de textos narrativos",
      "Produção textual: crônica",
      "Gramática: regência verbal",
      "Literatura: modernismo brasileiro",
      "Oralidade e apresentações",
      "Revisão e avaliação formativa",
    ].join("\n"),
    habilidadesSelecionadas: [
      {
        codigo: "EM13LP01",
        descricao: "Relacionar o texto com suas condições de produção.",
        conteudo: "Leitura e interpretação de textos narrativos",
      },
      {
        codigo: "EM13LP03",
        descricao: "Analisar relações de intertextualidade.",
        conteudo: "Produção textual: crônica",
      },
      {
        codigo: "EM13LP10",
        descricao: "Analisar obras significativas da literatura brasileira.",
        conteudo: "Literatura: modernismo brasileiro",
      },
    ],
  };
}

const result = generatePlanningFromBncc(buildPayload(), [1]);

assert.equal(result.usedAI, false);
assert.equal(result.engineMode, "bncc");
assert.equal(result.qualityScore, 100);
assert.ok(result.planejamento.conteudos.length === 6);

const periodSum = result.planejamento.conteudos.reduce(
  (sum, item) => sum + (item.periodos || 0),
  0,
);
assert.equal(periodSum, 80, "Carga horária deve somar 80 períodos");

const trimesters = new Set(result.planejamento.conteudos.map((item) => item.trimestre));
assert.ok(trimesters.has(1) && trimesters.has(2) && trimesters.has(3));

assert.ok(result.package);
assert.equal(result.package.bundleDocumentCount, 2);
assert.deepEqual(result.package.bundleLabels, ["Anual", "1º trimestre"]);

console.log("OK: planning-matrix-engine — BNCC + pacote anual + 1 trimestre");
