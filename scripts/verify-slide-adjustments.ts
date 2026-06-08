/**
 * Verificação estática + runtime das alterações de slides.
 * Executar: npx tsx scripts/verify-slide-adjustments.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  computeSlideBodyFontSize,
  computeSlideTitleFontSize,
  SLIDE_MIN_BODY_FONT,
} from "../src/lib/slides/slide-typography";
import { buildSlideAdjustPayload } from "../src/lib/materiais/elevate-material-client";
import type { MaterialEngineInput } from "../src/server/materials/material-engine-types";

const LOG_PATH = path.join(process.cwd(), "debug-1b39d8.log");
const SESSION_ID = "1b39d8";

function log(
  hypothesisId: string,
  message: string,
  data: Record<string, unknown>,
  runId = "verify-script",
) {
  const entry = {
    sessionId: SESSION_ID,
    runId,
    hypothesisId,
    location: "scripts/verify-slide-adjustments.ts",
    message,
    data,
    timestamp: Date.now(),
  };
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);
  console.log(`[${hypothesisId}] ${message}`, JSON.stringify(data));
}

// H1: fonte mínima >= 20 em todos os cenários de bullets
function verifyTypography() {
  const cases: Array<{
    bullets: string[];
    hasImage?: boolean;
    hasCallout?: boolean;
  }> = [];

  for (let count = 1; count <= 8; count += 1) {
    cases.push({ bullets: Array.from({ length: count }, (_, i) => `Item ${i + 1}`) });
    cases.push({
      bullets: Array.from({ length: count }, () => "x".repeat(150)),
      hasImage: true,
      hasCallout: true,
    });
  }

  let minBody = 999;
  let failures = 0;
  for (const c of cases) {
    const body = computeSlideBodyFontSize(c);
    const title = computeSlideTitleFontSize(body);
    minBody = Math.min(minBody, body);
    if (body < SLIDE_MIN_BODY_FONT) failures += 1;
    if (title < 24) failures += 1;
  }

  log("H1", "typography sweep", {
    cases: cases.length,
    minBody,
    minRequired: SLIDE_MIN_BODY_FONT,
    failures,
    pass: failures === 0 && minBody >= SLIDE_MIN_BODY_FONT,
  });
  return failures === 0;
}

// H2: imagens após texto no HTML (todos os layouts de conteúdo)
function verifyHtmlImageOrder() {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/server/materials/material-engine-service.ts"),
    "utf8",
  );
  const duasColunasMatch = src.match(
    /if \(layout === "duasColunas"\) \{\s*inner = `([^`]+)`/,
  );
  const fechamentoMatch = src.match(
    /if \(layout === "fechamento"\) \{\s*inner = `([\s\S]*?)`;\s*\} else \{/,
  );
  const defaultMatch = src.match(
    /\} else \{\s*inner = `([^`]+)`;\s*\}/,
  );

  const duasOrder = duasColunasMatch?.[1] ?? "";
  const fechamentoOrder = fechamentoMatch?.[1] ?? "";
  const defaultOrder = defaultMatch?.[1] ?? "";

  const imageAfterBullets = (order: string) => {
    const bulletsIdx = order.indexOf("${bulletsHtml}");
    const imageIdx = order.indexOf("${imageBlock}");
    return bulletsIdx >= 0 && imageIdx > bulletsIdx;
  };

  const noSub20ProjectedFonts = !src.includes("SLIDE_MIN_BODY_FONT - 2");

  const pass =
    imageAfterBullets(duasOrder) &&
    imageAfterBullets(defaultOrder) &&
    imageAfterBullets(fechamentoOrder) &&
    fechamentoOrder.includes("${imageBlock}") &&
    duasOrder.includes("${imageBlock}") &&
    noSub20ProjectedFonts &&
    !duasOrder.match(/display:\s*flex[^`]*\$\{figureHtml\}[^`]*\$\{bulletsHtml\}/);

  log("H2", "html image order in source", {
    duasOrder: duasOrder.trim(),
    fechamentoOrder: fechamentoOrder.trim(),
    defaultOrder: defaultOrder.trim(),
    imageAfterBulletsDuas: imageAfterBullets(duasOrder),
    imageAfterBulletsFechamento: imageAfterBullets(fechamentoOrder),
    imageAfterBulletsDefault: imageAfterBullets(defaultOrder),
    noSub20ProjectedFonts,
    pass,
  });
  return pass;
}

// H3: PPTX imagem abaixo do texto com contain
function verifyPptxImagePlacement() {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/server/materials/slide-pptx-builder.ts"),
    "utf8",
  );
  const hasContain = src.includes('sizing: { type: "contain"');
  const imageAfterBullets =
    src.indexOf("contentBottomY +=") < src.indexOf("if (hasImage && imageData)");
  const usesRemainingHeight = src.includes("remainingHeight = Math.max");
  const coverImageBelowText =
    src.includes("coverBottomY") &&
    src.includes("y: coverBottomY") &&
    !src.includes("x: 8.0,\n          y: 1.7");
  const calloutMin20 = src.includes(
    "fontSize: Math.max(SLIDE_MIN_BODY_FONT, bodyFontSize - 2)",
  );

  log("H3", "pptx image placement in source", {
    hasContain,
    imageAfterBullets,
    usesRemainingHeight,
    coverImageBelowText,
    calloutMin20,
    pass:
      hasContain &&
      imageAfterBullets &&
      usesRemainingHeight &&
      coverImageBelowText &&
      calloutMin20,
  });
  return (
    hasContain &&
    imageAfterBullets &&
    usesRemainingHeight &&
    coverImageBelowText &&
    calloutMin20
  );
}

// H4/H5: painel IA e payload de ajuste
function verifyAiAdjustPayload() {
  const base = {
    tipoMaterial: "slides",
    tema: "Fotossíntese",
    etapa: "fundamental",
    anoSerie: "6º ano",
    componenteCurricular: "Ciências",
    objetivo: "Compreender o processo",
    idempotencyKey: "test-key",
  } as MaterialEngineInput;

  const payload = buildSlideAdjustPayload(base, "Inclua um slide sobre curiosidades");
  const hasObservacoes = Boolean(payload.observacoes?.includes("AJUSTE SOLICITADO"));
  const hasInstruction = Boolean(
    payload.observacoes?.includes("Inclua um slide sobre curiosidades"),
  );
  const newKey = payload.idempotencyKey !== base.idempotencyKey;

  const materiaisSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/materiais/MateriaisClient.tsx"),
    "utf8",
  );
  const editorSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/editor/EditorClient.tsx"),
    "utf8",
  );
  const panelInMateriais = materiaisSrc.includes("SlideAiAdjustPanel");
  const panelInEditor = editorSrc.includes("SlideAiAdjustPanel");
  const panelConditionalSlides =
    materiaisSrc.includes('tipo === "slides"') && materiaisSrc.includes("SlideAiAdjustPanel");
  const payloadPersistence =
    materiaisSrc.includes("persistSlideGenerationPayload") &&
    materiaisSrc.includes("readSlideGenerationPayload") &&
    materiaisSrc.includes("slideAdjustPayload");
  const editorFlowSrc = fs.readFileSync(
    path.join(process.cwd(), "src/lib/materiais/material-editor-flow.ts"),
    "utf8",
  );
  const historyCarriesPayload = editorFlowSrc.includes("generationPayload:");

  log("H5", "ai adjust payload", {
    hasObservacoes,
    hasInstruction,
    newKey,
    pass: hasObservacoes && hasInstruction && newKey,
  });

  log("H4", "ai adjust panel integration", {
    panelInMateriais,
    panelInEditor,
    panelConditionalSlides,
    payloadPersistence,
    historyCarriesPayload,
    pass:
      panelInMateriais &&
      panelInEditor &&
      panelConditionalSlides &&
      payloadPersistence &&
      historyCarriesPayload,
  });

  return (
    hasObservacoes &&
    hasInstruction &&
    newKey &&
    panelInMateriais &&
    panelInEditor &&
    payloadPersistence &&
    historyCarriesPayload
  );
}

function main() {
  const results = {
    H1_typography: verifyTypography(),
    H2_htmlImageOrder: verifyHtmlImageOrder(),
    H3_pptxImagePlacement: verifyPptxImagePlacement(),
    H4_H5_aiAdjust: verifyAiAdjustPayload(),
  };
  const allPass = Object.values(results).every(Boolean);
  log("SUMMARY", "verification complete", { results, allPass });
  process.exit(allPass ? 0 : 1);
}

main();
