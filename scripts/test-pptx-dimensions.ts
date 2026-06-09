/**
 * Inspect generated PPTX slide dimensions.
 * Run: npx tsx scripts/test-pptx-dimensions.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { buildSlidesPptxBuffer } from "../src/server/materials/slide-pptx-builder";

async function main() {
  const sampleSlides = [
    {
      title: "Fotossíntese",
      subtitle: "6º ano · Ciências",
      layout: "capa" as const,
      bullets: [] as string[],
      speakerNotes: "",
    },
    {
      title: "O que é fotossíntese?",
      layout: "conteudo" as const,
      bullets: [
        "Processo das plantas verdes",
        "Usa luz solar, água e CO₂",
        "Produz glicose e oxigênio",
      ],
      speakerNotes: "Perguntar o que os alunos já sabem.",
    },
  ];

  const buffer = await buildSlidesPptxBuffer({
    title: "Teste Planify",
    slides: sampleSlides,
  });

  const outPath = path.join(process.cwd(), "tmp/test-slides-export.pptx");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);

  const zipDir = path.join(process.cwd(), "tmp/test-slides-export-unzipped");
  fs.rmSync(zipDir, { recursive: true, force: true });
  fs.mkdirSync(zipDir, { recursive: true });
  execSync(
    `powershell -Command "Copy-Item '${outPath}' '${outPath.replace(/\.pptx$/i, '.zip')}'; Expand-Archive -Path '${outPath.replace(/\.pptx$/i, '.zip')}' -DestinationPath '${zipDir}' -Force"`,
    { stdio: "inherit" },
  );

  const presXml = fs.readFileSync(
    path.join(zipDir, "ppt/presentation.xml"),
    "utf8",
  );
  const slideSizeMatch = presXml.match(/<p:sldSz[^>]+\/>/);
  const cxMatch = presXml.match(/cx="(\d+)"/);
  const cyMatch = presXml.match(/cy="(\d+)"/);

  const cx = cxMatch ? Number(cxMatch[1]) : 0;
  const cy = cyMatch ? Number(cyMatch[1]) : 0;

  console.log("Slide size tag:", slideSizeMatch?.[0]);
  console.log("Dimensions (inches):", (cx / 914400).toFixed(3), "x", (cy / 914400).toFixed(3));
  console.log("Expected Google 16:9:", "10.000 x 5.625");
  console.log("Expected LAYOUT_WIDE:", "13.333 x 7.500");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
