const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const src = path.join(root, "src");
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const suspiciousPatterns = [
  /ÃƒÂ¡|Ãƒ |ÃƒÂ¢|ÃƒÂ£|ÃƒÂ§|ÃƒÂ©|ÃƒÂª|ÃƒÂ­|ÃƒÂ³|ÃƒÂ´|ÃƒÂµ|ÃƒÂº/g,
  /ÃÂ¡|Ã |ÃÂ¢|ÃÂ£|ÃÂ§|ÃÂ©|ÃÂª|ÃÂ­|ÃÂ³|ÃÂ´|ÃÂµ|ÃÂº/g,
  /Ã‚Âº|Ã‚Âª|Ã‚Â°|Ã‚Â·|Ã‚Â¢|Ã‚Â£/g,
  /Ã¢â€šÂ¬|Ã¢â‚¬Â¢|Ã¢â‚¬â€œ|Ã¢â‚¬â€|Ã¢â‚¬Å“|Ã¢â‚¬|Ã¢â‚¬â„¢|Ã¢â‚¬Â¦/g,
  /ï¿½/g,
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "build"].includes(entry.name)) continue;
      files.push(...walk(full));
      continue;
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }

  return files;
}

const files = walk(src);
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (suspiciousPatterns.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    })) {
      findings.push({
        file: path.relative(root, file),
        line: index + 1,
        text: line.trim().slice(0, 220),
      });
    }
  });
}

console.log("");
console.log("Planify | VerificaÃ§Ã£o de encoding da interface");
console.log("");
console.log(`Arquivos verificados: ${files.length}`);

if (findings.length === 0) {
  console.log("OK: nenhuma marca real de texto quebrado encontrada na interface.");
} else {
  console.log("ATENÃ‡ÃƒO: ainda existem possÃ­veis textos quebrados:");
  for (const item of findings) {
    console.log(`${item.file}:${item.line}: ${item.text}`);
  }
}