import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractEntranceExamPdf } from "../src/server/banco-questoes/entrance-exam-pdf-extractor";
import type {
  EntranceExamExtractionConfig,
  EntranceExamExtractionReport,
  EntranceExamExtractedQuestion,
} from "../src/types/entrance-exam-extractor";

type Args = {
  inputDir: string;
  outputDir: string;
  configPath?: string;
  columns?: EntranceExamExtractionConfig["columns"];
  maxPages?: number;
};

type ConfigFile =
  | EntranceExamExtractionConfig
  | Record<string, EntranceExamExtractionConfig>;

function readArgValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  return args[index + 1];
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const inputDir =
    readArgValue(args, "--input") ||
    readArgValue(args, "-i") ||
    "data/teachy-ai-challenge/entrance-exams";
  const outputDir =
    readArgValue(args, "--output") ||
    readArgValue(args, "-o") ||
    "tmp/entrance-exam-extraction";
  const columnsRaw = readArgValue(args, "--columns");
  const maxPagesRaw = readArgValue(args, "--max-pages");

  return {
    inputDir,
    outputDir,
    configPath: readArgValue(args, "--config"),
    columns:
      columnsRaw === "1" || columnsRaw === "2"
        ? (Number(columnsRaw) as 1 | 2)
        : columnsRaw === "auto"
          ? "auto"
          : undefined,
    maxPages: maxPagesRaw ? Number(maxPagesRaw) : undefined,
  };
}

async function loadConfig(configPath?: string): Promise<ConfigFile> {
  if (!configPath) return {};
  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw) as ConfigFile;
}

function isConfigMap(value: ConfigFile): value is Record<string, EntranceExamExtractionConfig> {
  return Object.values(value).some(
    (entry) => entry && typeof entry === "object" && !Array.isArray(entry),
  );
}

function configForPdf(
  configFile: ConfigFile,
  pdfName: string,
): EntranceExamExtractionConfig {
  if (!isConfigMap(configFile)) return configFile;
  const baseName = pdfName.replace(/\.pdf$/i, "");
  return configFile[pdfName] || configFile[baseName] || configFile.default || {};
}

async function listPdfs(inputDir: string): Promise<string[]> {
  const entries = await readdir(inputDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => path.join(inputDir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  const args = parseArgs();
  const configFile = await loadConfig(args.configPath);
  const inputDir = path.resolve(args.inputDir);
  const outputDir = path.resolve(args.outputDir);
  const assetDir = path.join(outputDir, "assets");
  const pdfPaths = await listPdfs(inputDir);

  await mkdir(outputDir, { recursive: true });
  await mkdir(assetDir, { recursive: true });

  const allQuestions: EntranceExamExtractedQuestion[] = [];
  const reports: EntranceExamExtractionReport[] = [];

  for (const pdfPath of pdfPaths) {
    const pdfName = path.basename(pdfPath);
    const pdfBuffer = await readFile(pdfPath);
    const pdfConfig = {
      ...configForPdf(configFile, pdfName),
      columns: args.columns ?? configForPdf(configFile, pdfName).columns ?? "auto",
      maxPages: args.maxPages ?? configForPdf(configFile, pdfName).maxPages,
      tema: configForPdf(configFile, pdfName).tema || pdfName.replace(/\.pdf$/i, ""),
    };

    const result = await extractEntranceExamPdf({
      pdfBuffer,
      fileName: pdfName,
      config: pdfConfig,
      assetBaseDir: assetDir,
      assetPublicPath: "./assets",
    });

    allQuestions.push(...result.questions);
    reports.push(result.report);

    const outputName = `${pdfName.replace(/\.pdf$/i, "")}.questions.json`;
    await writeFile(
      path.join(outputDir, outputName),
      JSON.stringify(
        {
          questions: result.questions,
          report: result.report,
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  await writeFile(
    path.join(outputDir, "questions.json"),
    JSON.stringify(allQuestions, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(outputDir, "report.json"),
    JSON.stringify(reports, null, 2),
    "utf8",
  );

  console.log(
    `Extraidos ${allQuestions.length} item(ns) de ${pdfPaths.length} PDF(s). Saida: ${outputDir}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
