/**
 * Gera pacote real anual + 1 trimestral (motor BNCC, sem IA).
 * Run: npx tsx scripts/generate-planning-motor-sample.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePlanningFromBncc } from "../src/server/planejamentos/planning-matrix-engine";
import { buildOfficialPlanningDocx } from "../src/server/planejamentos/official-planning-docx";
import type { PlanningAiPayload } from "../src/server/planejamentos/planning-ai-service";
import type { OfficialPlanningPayload } from "../src/server/planejamentos/official-planning-docx";

const TRIMESTRE_PACOTE = 1;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "tmp", "planning-motor-sample-160");
function log(message: string, data: Record<string, unknown> = {}) {
  console.log(message, data);
}

const CONTEUDOS = [
  "Leitura e interpretação de textos narrativos",
  "Produção textual: crônica e relato",
  "Gramática: regência verbal e nominal",
  "Literatura brasileira: modernismo",
  "Oralidade: debates e apresentações",
  "Gêneros digitais e multimodalidade",
  "Argumentação e artigo de opinião",
  "Projeto de pesquisa e revisão bibliográfica",
  "Redação dissertativa-argumentativa",
  "Variação linguística e norma culta",
  "Literatura contemporânea brasileira",
  "Revisão integrada e avaliação formativa",
];

function buildPayload(cargaHoraria: string): PlanningAiPayload {
  return {
    tipoPlanejamento: "anual",
    escola: "EE Demonstração Planify",
    professor: "Prof.ª Maria Silva",
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    turma: "3ª série A",
    areaConhecimento: "Linguagens e suas Tecnologias",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria,
    objetivosGerais:
      "Desenvolver competências de leitura, escrita, oralidade e análise linguística alinhadas à BNCC.",
    observacoes: "Turma do 3º ano do EM — foco em preparação para vestibular e produção textual.",
    conteudos: CONTEUDOS.join("\n"),
    habilidadesSelecionadas: [
      {
        codigo: "EM13LP01",
        descricao:
          "Relacionar o texto, na produção e na leitura/escuta, com suas condições de produção e efeitos de sentido.",
        conteudo: CONTEUDOS[0],
      },
      {
        codigo: "EM13LP03",
        descricao:
          "Analisar relações de intertextualidade e interdiscursividade em textos diversos.",
        conteudo: CONTEUDOS[1],
      },
      {
        codigo: "EM13LP05",
        descricao:
          "Planejar, produzir, revisar e editar textos escritos e multissemióticos.",
        conteudo: CONTEUDOS[2],
      },
      {
        codigo: "EM13LP10",
        descricao:
          "Analisar obras significativas da literatura brasileira e de outros países.",
        conteudo: CONTEUDOS[3],
      },
      {
        codigo: "EM13LP15",
        descricao:
          "Argumentar com base em informações, fatos e dados de fontes confiáveis.",
        conteudo: CONTEUDOS[6],
      },
      {
        codigo: "EM13LP20",
        descricao:
          "Compartilhar produções orais e escritas em processos colaborativos.",
        conteudo: CONTEUDOS[4],
      },
    ],
    modoMatrizBncc: true,
    trimestresNoPacote: [TRIMESTRE_PACOTE],
  };
}

function buildZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(input: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of input) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(v: number) {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(v & 0xffff, 0);
    return b;
  }
  function u32(v: number) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(v >>> 0, 0);
    return b;
  }

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const fileName = Buffer.from(file.name, "utf8");
    const checksum = crc32(file.data);
    const localHeader = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(checksum), u32(file.data.length), u32(file.data.length),
      u16(fileName.length), u16(0), fileName,
    ]);
    localParts.push(localHeader, file.data);
    centralParts.push(
      Buffer.concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(checksum), u32(file.data.length), u32(file.data.length),
        u16(fileName.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), fileName,
      ]),
    );
    offset += localHeader.length + file.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);
  return Buffer.concat([
    localData,
    centralDirectory,
    Buffer.concat([
      u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(centralDirectory.length), u32(localData.length), u16(0),
    ]),
  ]);
}

function assertCargaHoraria(
  label: string,
  cargaEsperada: number,
  result: ReturnType<typeof generatePlanningFromBncc>,
) {
  const sum = result.planejamento.conteudos.reduce((t, i) => t + (i.periodos || 0), 0);
  assert.equal(sum, cargaEsperada, `${label}: soma de períodos deve ser ${cargaEsperada}, obteve ${sum}`);
  log(`${label} OK`, { cargaEsperada, periodSum: sum, itens: result.planejamento.conteudos.length });
}

function writePackage(cargaLabel: string, result: ReturnType<typeof generatePlanningFromBncc>) {
  const baseMeta: Omit<OfficialPlanningPayload, "tipoPlanejamento" | "matrizPlanejamento" | "trimestre"> = {
    escola: "EE Demonstração Planify",
    professor: "Prof.ª Maria Silva",
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    turma: "3ª série A",
    areaConhecimento: "Linguagens e suas Tecnologias",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: cargaLabel,
  };

  const annualDocx = buildOfficialPlanningDocx({
    ...baseMeta,
    tipoPlanejamento: "anual",
    matrizPlanejamento: result.planejamento,
  });

  const zipFiles: Array<{ name: string; data: Buffer }> = [
    { name: "planejamento-anual-lingua-portuguesa-3-serie.docx", data: annualDocx },
  ];

  const trimestrais = result.package?.trimestrais ?? {};
  const plan = trimestrais[TRIMESTRE_PACOTE];
  if (plan?.conteudos?.length) {
    const trimPeriods = plan.conteudos.reduce((s, i) => s + (i.periodos || 0), 0);
    const docx = buildOfficialPlanningDocx({
      ...baseMeta,
      tipoPlanejamento: "trimestral",
      trimestre: String(TRIMESTRE_PACOTE),
      cargaHoraria: `${trimPeriods} períodos`,
      matrizPlanejamento: plan,
    });
    zipFiles.push({
      name: `planejamento-trimestral-${TRIMESTRE_PACOTE}-lingua-portuguesa-3-serie.docx`,
      data: docx,
    });
    fs.writeFileSync(path.join(OUT_DIR, zipFiles[zipFiles.length - 1].name), docx);
  }

  fs.writeFileSync(path.join(OUT_DIR, zipFiles[0].name), annualDocx);
  const zip = buildZip(zipFiles);
  const zipName = `planify-anual-trim-${TRIMESTRE_PACOTE}-${cargaLabel.replace(/\D+/g, "")}-periodos.zip`;
  fs.writeFileSync(path.join(OUT_DIR, zipName), zip);

  return { zipName, zipFiles: zipFiles.map((f) => f.name) };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const carga of [80, 160, 200]) {
    const label = `${carga} períodos`;
    const result = generatePlanningFromBncc(buildPayload(label), [TRIMESTRE_PACOTE]);
    assertCargaHoraria(label, carga, result);
    assert.equal(result.package?.bundleDocumentCount, 2);
  }

  const cargaPrincipal = "160 períodos";
  const result = generatePlanningFromBncc(buildPayload(cargaPrincipal), [TRIMESTRE_PACOTE]);
  const { zipName, zipFiles } = writePackage(cargaPrincipal, result);

  const trimestrePeriodos = Object.fromEntries(
    Object.entries(result.package?.trimestralPlanCounts ?? {}).map(([k, v]) => {
      const plan = result.package?.trimestrais[Number(k)];
      const periods = plan?.conteudos.reduce((s, i) => s + (i.periodos || 0), 0) ?? 0;
      return [k, { conteudos: v, periodos: periods }];
    }),
  );

  log("Pacote 160 períodos gerado", {
    zipName,
    zipFiles,
    qualityScore: result.qualityScore,
    annualItems: result.planejamento.conteudos.length,
    trimestrePeriodos,
    outDir: OUT_DIR,
  });

  console.log("\n=== ARQUIVOS GERADOS ===");
  console.log(OUT_DIR);
  for (const name of fs.readdirSync(OUT_DIR)) {
    const stat = fs.statSync(path.join(OUT_DIR, name));
    console.log(`  ${name} (${Math.round(stat.size / 1024)} KB)`);
  }
}

main();
