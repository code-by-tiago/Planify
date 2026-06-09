import fs from "node:fs";
import { inflateRawSync } from "node:zlib";
import { buildTrimestralPlansFromAnnual } from "../src/lib/planejamentos/planning-trimestral-from-annual";
import { buildOfficialPlanningDocx } from "../src/server/planejamentos/official-planning-docx";
import type { OfficialPlanningPayload } from "../src/server/planejamentos/official-planning-docx";
import type { PlanningMatrixItem } from "../src/server/planejamentos/planning-ai-service";

function readZipDocxText(buffer: Buffer): string {
  let eocdOffset = -1;

  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error("ZIP inválido");
  }

  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralOffset;

  while (offset < eocdOffset) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x02014b50) break;

    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    offset += 46 + fileNameLength + extraLength + commentLength;

    if (fileName !== "word/document.xml") continue;

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart =
      localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const xml = inflateRawSync(compressed).toString("utf8");
    return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  throw new Error("word/document.xml não encontrado");
}

function verifyAnnualConsonance(): void {
  const annualContents: PlanningMatrixItem[] = [
    {
      conteudo: "Conteúdo T1-A",
      trimestre: 1,
      numeroAula: 1,
      periodos: 4,
      aulaInicio: 1,
      aulaFim: 4,
      habilidades: [{ codigo: "EF05HI01", descricao: "Habilidade T1" }],
      objetivos: "Objetivo T1",
      metodologia: "Metodologia T1",
      materiais: "Material T1",
      recursos: "Recurso T1",
      etapas: "Etapa T1",
      evidencias: "Evidência T1",
      avaliacao: "Avaliação T1",
    },
    {
      conteudo: "Conteúdo T2-A",
      trimestre: 2,
      numeroAula: 2,
      periodos: 3,
      aulaInicio: 5,
      aulaFim: 7,
      habilidades: [{ codigo: "EF05HI02", descricao: "Habilidade T2" }],
      objetivos: "Objetivo T2",
      metodologia: "Metodologia T2",
      materiais: "Material T2",
      recursos: "Recurso T2",
      etapas: "Etapa T2",
      evidencias: "Evidência T2",
      avaliacao: "Avaliação T2",
    },
  ];

  const trim1 = buildTrimestralPlansFromAnnual(
    {
      titulo: "Planejamento anual",
      resumo: "Resumo anual",
      conteudos: annualContents,
    },
    [1],
  )[1];

  if (!trim1 || trim1.conteudos.length !== 1) {
    throw new Error("Trimestre 1 deveria conter exatamente 1 conteúdo extraído do anual.");
  }

  const trimItem = trim1.conteudos[0];
  const annualItem = annualContents[0];

  if (trimItem.conteudo !== annualItem.conteudo) {
    throw new Error("Conteúdo trimestral divergiu do anual.");
  }

  if (trimItem.habilidades[0]?.codigo !== annualItem.habilidades[0]?.codigo) {
    throw new Error("Habilidades trimestrais divergiram do anual.");
  }

  if (trimItem.numeroAula !== 1 || trimItem.aulaInicio !== 1 || trimItem.aulaFim !== 4) {
    throw new Error("Renumeração trimestral inconsistente com o anual.");
  }

  console.log("OK: trimestral extraído em consonância com o planejamento anual.");
}

verifyAnnualConsonance();

const payload: OfficialPlanningPayload = {
  tipoPlanejamento: "trimestral",
  trimestre: "1",
  escola: "Escola Teste",
  professor: "Prof. Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "Ciências Humanas",
  componenteCurricular: "História",
  cargaHoraria: "12",
  matrizPlanejamento: {
    conteudos: [
      {
        conteudo: "Brasil colonial e escravidão",
        trimestre: 1,
        numeroAula: 1,
        periodos: 4,
        aulaInicio: 1,
        aulaFim: 4,
        habilidades: [
          {
            codigo: "EF05HI01",
            descricao: "Identificar os processos de formação das culturas e dos povos.",
          },
        ],
        objetivos: "Compreender a formação da sociedade colonial brasileira.",
        metodologia:
          "Contextualização histórica, leitura de fontes, debate orientado e registro no caderno.",
        materiais: "Caderno, fichas impressas e mapa histórico.",
        recursos: "Quadro, projetor e livro didático.",
        etapas:
          "1. Contextualização do tema.\n2. Análise de fontes históricas.\n3. Síntese e avaliação formativa.",
        evidencias: "Registros escritos, participação no debate e mapa conceitual.",
        avaliacao: "Rubrica de participação, produção escrita e devolutiva oral.",
      },
    ],
  },
};

const buffer = buildOfficialPlanningDocx(payload);
function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const text = normalizeSearch(readZipDocxText(buffer));

const requiredSnippets = [
  "tempo, memoria, cultura e sociedade",
  "brasil colonial e escravidao",
  "ef05hi01",
  "compreender a formacao da sociedade colonial brasileira",
  "contextualizacao historica",
  "caderno, fichas impressas",
  "projetor",
  "livro didatico",
  "1. contextualizacao do tema",
  "registros escritos",
  "rubrica de participacao",
  "semana 1 (4 periodos)",
];

const missing = requiredSnippets.filter((snippet) => !text.includes(snippet));

if (missing.length > 0) {
  console.error("Falha: campos trimestrais ausentes no DOCX:", missing);
  process.exit(1);
}

fs.mkdirSync("tmp", { recursive: true });
fs.writeFileSync("tmp/verify-trimestral-planning-fields.docx", buffer);

console.log("OK: planejamento trimestral preenche os campos exigidos no modelo oficial.");
console.log("Arquivo gerado: tmp/verify-trimestral-planning-fields.docx");
