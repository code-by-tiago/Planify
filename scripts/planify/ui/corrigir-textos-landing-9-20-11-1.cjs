const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const allowedExtensions = new Set([".tsx", ".ts", ".jsx", ".js", ".css"]);

const excludedPathParts = [
  `${path.sep}.next${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}api${path.sep}`,
  `${path.sep}scripts${path.sep}`,
  `${path.sep}docs${path.sep}`,
];

const excludedExactFiles = new Set([
  path.join(root, "src", "components", "PlanifyFieldEnhancer.tsx"),
]);

function shouldSkip(file) {
  if (!allowedExtensions.has(path.extname(file))) return true;
  if (file.includes(".bak-")) return true;
  if (excludedExactFiles.has(file)) return true;

  return excludedPathParts.some((part) => file.includes(part));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".vercel", "dist", "out"].includes(entry.name)) {
        continue;
      }

      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-20-11-1-${stamp}`);
}

function decodeLiteralUnicodeEscapes(content) {
  return content
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
      const codePoint = Number.parseInt(hex, 16);
      if (!Number.isFinite(codePoint)) return _;
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return _;
      }
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
      const codePoint = Number.parseInt(hex, 16);
      if (!Number.isFinite(codePoint)) return _;
      return String.fromCharCode(codePoint);
    });
}

const mojibakePairs = [
  ["\u00c3\u00a1", "\u00e1"],
  ["\u00c3\u00a0", "\u00e0"],
  ["\u00c3\u00a2", "\u00e2"],
  ["\u00c3\u00a3", "\u00e3"],
  ["\u00c3\u00a4", "\u00e4"],
  ["\u00c3\u00a7", "\u00e7"],
  ["\u00c3\u00a9", "\u00e9"],
  ["\u00c3\u00aa", "\u00ea"],
  ["\u00c3\u00ad", "\u00ed"],
  ["\u00c3\u00b3", "\u00f3"],
  ["\u00c3\u00b4", "\u00f4"],
  ["\u00c3\u00b5", "\u00f5"],
  ["\u00c3\u00ba", "\u00fa"],
  ["\u00c3\u0081", "\u00c1"],
  ["\u00c3\u0080", "\u00c0"],
  ["\u00c3\u0082", "\u00c2"],
  ["\u00c3\u0083", "\u00c3"],
  ["\u00c3\u0087", "\u00c7"],
  ["\u00c3\u0089", "\u00c9"],
  ["\u00c3\u008a", "\u00ca"],
  ["\u00c3\u008d", "\u00cd"],
  ["\u00c3\u0093", "\u00d3"],
  ["\u00c3\u0094", "\u00d4"],
  ["\u00c3\u0095", "\u00d5"],
  ["\u00c3\u009a", "\u00da"],
  ["\u00c2\u00ba", "\u00ba"],
  ["\u00c2\u00aa", "\u00aa"],
  ["\u00c2\u00b0", "\u00b0"],
  ["\u00c2\u00b4", "\u00b4"],
  ["\u00c2", ""],
  ["\u00e2\u20ac\u201d", "\u2014"],
  ["\u00e2\u20ac\u201c", "\u2013"],
  ["\u00e2\u20ac\u0153", "\u201c"],
  ["\u00e2\u20ac\u009d", "\u201d"],
  ["\u00e2\u20ac\u02dc", "\u2018"],
  ["\u00e2\u20ac\u2122", "\u2019"],
  ["\u00e2\u2026\u201c", "\u2026"],
];

const phrasePairs = [
  ["D\\u00favidas frequentes", "D\u00favidas frequentes"],
  ["Antes de come\\u00e7ar", "Antes de come\u00e7ar"],
  ["Come\\u00e7ar agora", "Come\u00e7ar agora"],
  ["conte\\u00fado", "conte\u00fado"],
  ["conte\\u00fados", "conte\u00fados"],
  ["avan\\u00e7ado", "avan\u00e7ado"],
  ["experi\\u00eancia", "experi\u00eancia"],
  ["pedag\\u00f3gica", "pedag\u00f3gica"],
  ["pedag\\u00f3gico", "pedag\u00f3gico"],
  ["Informa\\u00e7\\u00f5es", "Informa\u00e7\u00f5es"],
  ["avalia\\u00e7\\u00f5es", "avalia\u00e7\u00f5es"],
  ["Seguran\\u00e7a", "Seguran\u00e7a"],
];

function fixMojibake(content) {
  let next = content;

  for (const [bad, good] of mojibakePairs) {
    next = next.split(bad).join(good);
  }

  for (const [bad, good] of phrasePairs) {
    next = next.split(bad).join(good);
  }

  return next;
}

function patchFile(file) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;

  next = decodeLiteralUnicodeEscapes(next);
  next = fixMojibake(next);

  if (next !== original) {
    backup(file);
    fs.writeFileSync(file, next, "utf8");
    return true;
  }

  return false;
}

const roots = [
  path.join(root, "src", "app"),
  path.join(root, "src", "components"),
].filter(fs.existsSync);

const files = roots.flatMap((dir) => walk(dir)).filter((file) => !shouldSkip(file));

let changed = 0;
const changedFiles = [];

for (const file of files) {
  if (patchFile(file)) {
    changed += 1;
    changedFiles.push(path.relative(root, file).replaceAll("\\", "/"));
  }
}

console.log("");
console.log("Planify | 9.20.11.1 Correção de textos/encoding");
console.log("");

if (changed === 0) {
  console.log("[OK] Nenhum arquivo precisou de correção.");
} else {
  console.log(`[OK] Arquivos corrigidos: ${changed}`);
  for (const file of changedFiles) {
    console.log(` - ${file}`);
  }
}

console.log("");
console.log("[OK] Correção aplicada sem alterar APIs, banco, Stripe, Supabase, DOCX, BNCC ou lógica funcional.");
