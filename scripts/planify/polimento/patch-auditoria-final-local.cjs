const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const auditPath = path.join(root, "scripts", "planify", "auditoria", "auditoria-final-local.cjs");

if (!fs.existsSync(auditPath)) {
  console.log("AVISO: auditoria-final-local.cjs não encontrado. Nada para ajustar.");
  process.exit(0);
}

fs.copyFileSync(auditPath, `${auditPath}.bak-9-16-1`);

let text = fs.readFileSync(auditPath, "utf8");

// Evita terminal quebrado em Windows PowerShell antigo: troca emojis do relatório por texto ASCII.
text = text
  .replaceAll("✅", "[OK]")
  .replaceAll("⚠️", "[AVISO]")
  .replaceAll("⚠", "[AVISO]")
  .replaceAll("❌", "[ERRO]");

// Se o script antigo avisava qualquer "Gemini" em src inteiro, reduzimos para arquivo visual.
// Isso evita falsos positivos em server/ai, types e config/env, onde Gemini é interno.
const oldBlock = `if (
      !file.includes("/api/") &&
      !file.includes("\\\\api\\\\") &&
      !file.toLowerCase().includes("gemini") &&
      /Gemini/i.test(text)
    ) {
      visibleGemini.push(file);
    }`;

const newBlock = `const normalizedFile = file.replaceAll("\\\\\\\\", "/").toLowerCase();
    const isUserVisibleFile =
      normalizedFile.startsWith("src/app/") ||
      normalizedFile.startsWith("src/components/") ||
      normalizedFile === "src/lib/navigation.ts";

    const isInternalFile =
      normalizedFile.includes("/api/") ||
      normalizedFile.includes("/server/") ||
      normalizedFile.includes("/types/") ||
      normalizedFile.includes("/config/") ||
      normalizedFile.toLowerCase().includes("gemini");

    if (isUserVisibleFile && !isInternalFile && /Gemini/i.test(text)) {
      visibleGemini.push(file);
    }`;

if (text.includes(oldBlock)) {
  text = text.replace(oldBlock, newBlock);
} else {
  // Fallback: se a estrutura estiver diferente, não mexe agressivamente.
  console.log("AVISO: bloco antigo de verificação Gemini não encontrado. Mantive a lógica atual.");
}

fs.writeFileSync(auditPath, text, "utf8");

console.log("OK: auditoria ajustada para saída ASCII e Gemini apenas em arquivos visuais.");
