const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const possibleFiles = [
  "src/app/planejamentos/PlanejamentosClient.tsx",
  "src/app/planejamentos/page.tsx",
];

function patchFile(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    return false;
  }

  let text = fs.readFileSync(full, "utf8");
  const original = text;

  fs.copyFileSync(full, `${full}.bak-9-14-1-bncc-conteudos`);

  const replacements = [
    ["/api/planejamentos/gerar?modo=habilidades", "/api/bncc/sugerir"],
    ["/api/planejamentos/gerar?modo=bncc", "/api/bncc/sugerir"],
    ["/api/planejamentos/habilidades", "/api/bncc/sugerir"],
    ["/api/bncc/habilidades", "/api/bncc/sugerir"],
    ["/api/bncc/sugestoes", "/api/bncc/sugerir"],
  ];

  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }

  // Melhora mensagens visíveis antigas, sem alterar lógica.
  text = text.split("Sugira habilidades a partir dos objetivos").join("Sugira habilidades a partir dos conteúdos");
  text = text.split("objetivos e observações").join("conteúdos informados");
  text = text.split("objetivos e observacoes").join("conteúdos informados");
  text = text.split("Gerar planejamento com Gemini").join("Gerar planejamento com IA");
  text = text.split("Gemini").join("IA");

  if (text !== original) {
    fs.writeFileSync(full, text, "utf8");
    console.log(`Ajustado: ${relativePath}`);
    return true;
  }

  console.log(`Sem alterações necessárias: ${relativePath}`);
  return false;
}

let changed = 0;

for (const file of possibleFiles) {
  if (patchFile(file)) {
    changed += 1;
  }
}

console.log("");
console.log("Planify 9.14.1 | Patch BNCC por conteúdo aplicado.");
console.log(`Arquivos alterados: ${changed}`);
console.log("");
console.log("Rota principal de sugestão:");
console.log("/api/bncc/sugerir");
console.log("");
console.log("Alias compatível:");
console.log("/api/planejamentos/habilidades");
