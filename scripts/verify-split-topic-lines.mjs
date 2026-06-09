/**
 * Verifica normalização de tópicos do campo Conteúdos.
 * Run: node scripts/verify-split-topic-lines.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ts = require("typescript");

function loadSplitTopicLines() {
  const sourcePath = join(root, "src/lib/bncc/split-topic-lines.ts");
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const runner = new Function("exports", "require", "module", transpiled);
  runner(module.exports, require, module);
  return module.exports;
}

const {
  splitTopicLines,
  normalizeConteudosFieldText,
  conteudosFieldNeedsNormalization,
  conteudosTopicsWouldChange,
} = loadSplitTopicLines();

assert.deepEqual(
  splitTopicLines("Literatura, romance e poesia"),
  ["Literatura", "romance e poesia"],
);

assert.deepEqual(
  splitTopicLines("Literatura, romance e poesia\nProdução textual"),
  ["Literatura, romance e poesia", "Produção textual"],
);

assert.deepEqual(
  splitTopicLines("Tema A; Tema B · Tema C"),
  ["Tema A", "Tema B", "Tema C"],
);

assert.deepEqual(
  normalizeConteudosFieldText("• Povos originários\n- Chegada dos portugueses\n2) Colonização"),
  "Povos originários\nChegada dos portugueses\nColonização",
);

assert.equal(
  conteudosFieldNeedsNormalization("Tema A; Tema B"),
  true,
);

assert.equal(
  conteudosTopicsWouldChange("Tema A; Tema B"),
  false,
);

assert.equal(
  conteudosFieldNeedsNormalization("Tema A\nTema B\n"),
  false,
);

assert.equal(
  conteudosFieldNeedsNormalization(" • Tema A\n • Tema B"),
  true,
);

assert.equal(
  conteudosTopicsWouldChange(" • Tema A\n • Tema B"),
  false,
);

console.log("verify-split-topic-lines: OK");
