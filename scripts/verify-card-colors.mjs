import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadTs(relativePath) {
  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
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
  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    transpiled,
  );
  evaluator(module.exports, require, module, dirname(sourcePath), sourcePath);
  return module.exports;
}

const enhance = loadTs("src/lib/editor/enhance-export-html.ts");
const sample = `
<article class="planify-flashcard" style="border:1px solid #f43f5e33;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#e11d48,#f43f5e);color:#ffffff;">Pergunta</div>
  <div style="background:rgba(255,255,255,0.22);">Badge</div>
  <div style="background:#fff1f2;color:#475569;">Resposta</div>
</article>
`;

const enhanced = enhance.enhanceHtmlForExport(sample);

assert.match(enhanced, /background-color:#e11d48/i);
assert.doesNotMatch(enhanced, /linear-gradient/i);
assert.doesNotMatch(enhanced, /rgba\(/i);
assert.doesNotMatch(enhanced, /#f43f5e33/i);

console.log("Card color enhancement verified.");
