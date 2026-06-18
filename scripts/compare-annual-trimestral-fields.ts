/**
 * Compara campos do anual T1 com o DOCX trimestral-1 gerado (pipeline semanas).
 * Run: npx tsx scripts/compare-annual-trimestral-fields.ts
 */
import { inflateRawSync } from "node:zlib";
import { generatePlanningFromBncc } from "../src/server/planejamentos/planning-matrix-engine";
import { extractAnnualItemsForTrimester } from "../src/lib/planejamentos/planning-trimestral-from-annual";
import { buildOfficialPlanningDocx } from "../src/server/planejamentos/official-planning-docx";
import {
  deriveExpectativaAprendizagem,
  enrichObjetoConhecimento,
  enrichUnidadeTematica,
  formatHabilidadesBnccAnual,
} from "../src/lib/planejamentos/planning-annual-field-enrichment";

function readZipDocxText(buffer: Buffer): string {
  let eocdOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralOffset;
  while (offset < eocdOffset) {
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    offset += 46 + fileNameLength + extraLength + commentLength;
    if (fileName !== "word/document.xml") continue;
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    return inflateRawSync(compressed)
      .toString("utf8")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  throw new Error("word/document.xml não encontrado");
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesNormalized(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

const CONTEUDOS = [
  "Leitura e interpretação de textos narrativos",
  "Produção textual: crônica e relato",
  "Gramática: regência verbal e nominal",
  "Literatura brasileira: modernismo",
];

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
  conteudos: CONTEUDOS.join("\n"),
  habilidadesSelecionadas: [
    { codigo: "EM13LP01", descricao: "Relacionar o texto.", conteudo: CONTEUDOS[0] },
    { codigo: "EM13LP03", descricao: "Analisar intertextualidade.", conteudo: CONTEUDOS[1] },
    { codigo: "EM13LP05", descricao: "Planejar textos.", conteudo: CONTEUDOS[2] },
    { codigo: "EM13LP10", descricao: "Analisar literatura.", conteudo: CONTEUDOS[3] },
  ],
  modoMatrizBncc: true,
  trimestresNoPacote: [1],
};

const result = generatePlanningFromBncc(payload, [1]);
const annualItems = extractAnnualItemsForTrimester(result.planejamento.conteudos, 1);
const trimPlan = result.package?.trimestrais[1];

if (!trimPlan) {
  throw new Error("Pacote trimestral 1 ausente.");
}

const trimBuffer = buildOfficialPlanningDocx({
  escola: payload.escola,
  professor: payload.professor,
  etapa: payload.etapa,
  anoSerie: payload.anoSerie,
  turma: payload.turma,
  areaConhecimento: payload.areaConhecimento,
  componenteCurricular: payload.componenteCurricular,
  cargaHoraria: payload.cargaHoraria,
  tipoPlanejamento: "trimestral",
  trimestre: "1",
  matrizPlanejamento: trimPlan,
});

const docText = readZipDocxText(trimBuffer);
let failed = false;

for (let i = 0; i < annualItems.length; i += 1) {
  const annual = annualItems[i];
  const trimItem = trimPlan.conteudos[i];
  const component = payload.componenteCurricular;

  console.log(`\n=== Aula ${i + 1}: ${annual.conteudo.slice(0, 50)} ===`);

  if (annual.conteudo !== trimItem.conteudo) {
    console.error("  FALHA: item trimestral diverge do anual na matriz");
    failed = true;
  }

  const matrixChecks: Array<[string, string]> = [
    ["conteudo", annual.conteudo],
    ["unidade", enrichUnidadeTematica(annual.conteudo, component, annual.habilidades || [])],
    ["objeto", enrichObjetoConhecimento(annual.conteudo, annual.habilidades || [])],
    ["habilidade", formatHabilidadesBnccAnual(annual.habilidades || [])],
    ["expectativa", deriveExpectativaAprendizagem(annual.conteudo, annual.habilidades || [])],
  ];

  for (const [label, expected] of matrixChecks) {
    const snippet = expected.slice(0, Math.min(60, expected.length));
    if (!snippet || !includesNormalized(docText, snippet)) {
      console.error(`  FALHA: ${label} ausente no DOCX trimestral`);
      failed = true;
    } else {
      console.log(`  OK ${label}`);
    }
  }

  const semanas = (trimItem.semanas || []).filter((s) => s.etapas.trim());
  if (semanas.length < 2) {
    console.error(`  FALHA: pipeline deveria gerar múltiplas semanas (obteve ${semanas.length})`);
    failed = true;
  } else {
    console.log(`  OK ${semanas.length} semanas no pipeline`);
  }

  for (const semana of semanas) {
    const etapaSnippet = semana.etapas.slice(0, Math.min(35, semana.etapas.length));
    if (!includesNormalized(docText, etapaSnippet)) {
      console.error(`  FALHA: etapa semana ${semana.semana} ausente no DOCX`);
      failed = true;
    } else {
      console.log(`  OK etapa semana ${semana.semana}`);
    }
  }

  const materiaisAnual = `${annual.materiais || ""} ${annual.recursos || ""}`.trim();
  const firstMaterial = materiaisAnual.split(/[,;]/)[0]?.trim().slice(0, 20);
  if (firstMaterial && !includesNormalized(docText, firstMaterial)) {
    console.error("  FALHA: materiais do anual não refletidos no trimestral");
    failed = true;
  } else {
    console.log("  OK materiais derivados do anual");
  }
}

if (failed) {
  process.exit(1);
}

console.log("\nOK: trimestral 1 consonante com anual T1 (matriz + semanas do pipeline).");
