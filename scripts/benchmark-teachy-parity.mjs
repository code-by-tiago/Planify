/**
 * Benchmark Teachy parity: checks Planify sample snippets against structural markers.
 * Run: node scripts/benchmark-teachy-parity.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const samplesDir = join(root, "docs/teachy-benchmark/samples");

const SCENARIOS = [
  {
    slug: "planify-lista",
    markers: ["planify-questao-card", "planify-gabarito"],
    minScore: 70,
  },
  {
    slug: "planify-prova",
    markers: ["planify-questao-card", "gabarito"],
    minScore: 70,
  },
  {
    slug: "teachy-quiz-generator",
    markers: ["Disciplina", "gabarito"],
    minScore: 50,
  },
];

function scoreSnippet(text, markers) {
  if (!text?.trim()) return 0;
  const hits = markers.filter((m) => text.toLowerCase().includes(m.toLowerCase())).length;
  return Math.round((hits / markers.length) * 100);
}

function loadSnippet(slug) {
  const snippetPath = join(samplesDir, slug, "output-snippet.txt");
  if (!existsSync(snippetPath)) return "";
  return readFileSync(snippetPath, "utf8");
}

let passed = 0;
let skipped = 0;

for (const scenario of SCENARIOS) {
  const snippet = loadSnippet(scenario.slug);
  if (!snippet.trim()) {
    console.log(`SKIP ${scenario.slug}: output-snippet.txt missing or empty`);
    skipped += 1;
    continue;
  }
  const score = scoreSnippet(snippet, scenario.markers);
  assert.ok(
    score >= scenario.minScore,
    `${scenario.slug}: parity score ${score} < ${scenario.minScore}`,
  );
  console.log(`OK ${scenario.slug}: parity ${score}/100`);
  passed += 1;
}

const sampleDirs = readdirSync(samplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

console.log(
  `\nBenchmark summary: ${passed} passed, ${skipped} skipped, ${sampleDirs.length} sample dirs`,
);

if (passed === 0 && skipped === SCENARIOS.length) {
  console.warn("Warning: no snippets scored — add output-snippet.txt under samples/");
  process.exit(0);
}

console.log("benchmark-teachy-parity: all scored scenarios passed");
