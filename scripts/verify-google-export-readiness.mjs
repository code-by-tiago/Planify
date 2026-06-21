/**
 * Valida motores de exportação Google e DOCX oficial (offline).
 * Run: node scripts/verify-google-export-readiness.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SAMPLE_MATRIX = {
  titulo: "Planejamento anual História 5º ano",
  tipoPlanejamento: "anual",
  resumo: "Resumo",
  conteudos: [
    {
      conteudo: "Brasil colonial",
      trimestre: 1,
      habilidades: [{ codigo: "EF05HI01", descricao: "Habilidade teste" }],
      objetivos: "Objetivo",
      metodologia: "Metodologia",
      avaliacao: "Avaliação",
    },
  ],
};

const PAYLOAD_ANUAL = {
  tipoPlanejamento: "anual",
  escola: "Escola Teste",
  professor: "Prof",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  componenteCurricular: "História",
  cargaHoraria: "80h",
  matrizPlanejamento: SAMPLE_MATRIX,
};

const PAYLOAD_TRIM = {
  ...PAYLOAD_ANUAL,
  tipoPlanejamento: "trimestral",
  trimestre: "1",
};

function main() {
  const {
    buildOfficialPlanningDocx,
    getOfficialPlanningTipo,
    normalizeOfficialPlanningPayload,
  } = loadTsModule("src/server/planejamentos/official-planning-docx.ts");
  const { resolveSlidesExportCompatible, resolveSlideDeck } = loadTsModule(
    "src/lib/google/document-type-detection.ts",
  );
  const {
    buildOfficialPlanningPayloadFromGeneration,
    buildOfficialPlanningPayloadFromEditorMeta,
    inferPlanningTipoFromExportContext,
  } = loadTsModule("src/lib/planejamentos/planning-google-export-payload.ts");
  const { embedPlanningPayloadInHtml, extractPlanningPayloadFromHtml } = loadTsModule(
    "src/lib/planejamentos/planning-export-embed.ts",
  );

  const anualBuf = buildOfficialPlanningDocx(PAYLOAD_ANUAL);
  const trimBuf = buildOfficialPlanningDocx(PAYLOAD_TRIM);

  const trimTipo = getOfficialPlanningTipo(
    normalizeOfficialPlanningPayload(PAYLOAD_TRIM, "planejamento:trimestral", "plan_key_trim2"),
  );
  const trim2Buf = buildOfficialPlanningDocx(
    normalizeOfficialPlanningPayload(
      { ...PAYLOAD_ANUAL, trimestre: "2" },
      "planejamento:trimestral",
      "plan_key_trim2",
    ),
    { documentType: "planejamento:trimestral", documentId: "plan_key_trim2" },
  );

  const bundleMetaPayload = buildOfficialPlanningPayloadFromEditorMeta(
    {
      componente: "História",
      anoSerie: "5º ano",
      etapa: "EF",
      tipoPlanejamento: undefined,
      generationPayload: { tipoPlanejamento: "anual", trimestre: "1" },
      matrizPlanejamento: {
        tipoPlanejamento: "trimestral",
        conteudos: SAMPLE_MATRIX.conteudos.map((item) => ({ ...item, trimestre: 2 })),
      },
    },
    {
      documentType: "planejamento:trimestral",
      documentId: "plan_demo_trim2",
      title: "Planejamento trimestral — 2º trimestre",
    },
  );

  let missingMatrixThrows = false;
  try {
    buildOfficialPlanningDocx({ tipoPlanejamento: "anual", matrizPlanejamento: { conteudos: [] } });
  } catch {
    missingMatrixThrows = true;
  }

  const slideHtml = '<div class="planify-slide-deck"><section class="planify-slide"></section></div>';
  const apostilaHtml = "<p>Apostila simples</p>";
  const slidesDeck = resolveSlideDeck(() => slideHtml, "material:slides", false);
  const slidesCompatDeck = resolveSlidesExportCompatible(() => slideHtml, "material:slides", false);
  const apostilaSlides = resolveSlidesExportCompatible(() => apostilaHtml, "material:apostila", false);

  const built = buildOfficialPlanningPayloadFromGeneration({
    tipoPlanejamento: "anual",
    escola: "E",
    professor: "P",
    etapa: "EF",
    anoSerie: "5",
    componenteCurricular: "História",
    cargaHoraria: "80h",
    matrizPlanejamento: SAMPLE_MATRIX,
  });

  const embedded = embedPlanningPayloadInHtml("<p>Planejamento</p>", PAYLOAD_ANUAL);
  const extracted = extractPlanningPayloadFromHtml(embedded);

  const failed =
    anualBuf.length < 8000 ||
    trimBuf.length < 5000 ||
    anualBuf.equals(trimBuf) ||
    trimTipo !== "trimestral" ||
    trim2Buf.equals(anualBuf) ||
    bundleMetaPayload?.tipoPlanejamento !== "trimestral" ||
    bundleMetaPayload?.trimestre !== "2" ||
    !missingMatrixThrows ||
    !built?.matrizPlanejamento ||
    !extracted?.matrizPlanejamento ||
    !slidesDeck ||
    !slidesCompatDeck ||
    apostilaSlides;

  if (failed) {
    console.error("verify-google-export-readiness: FAIL");
    process.exit(1);
  }

  console.log("verify-google-export-readiness: OK");
}

main();
