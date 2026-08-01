const fs = require("fs");
const path = require("path");

const root = process.cwd();

const routes = [
  { route: "/", file: "src/app/page.tsx" },
  { route: "/login", file: "src/app/login/page.tsx" },
  { route: "/dashboard", file: "src/app/dashboard/page.tsx" },
  { route: "/planejamentos", file: "src/app/planejamentos/page.tsx" },
  { route: "/materiais", file: "src/app/materiais/page.tsx" },
  { route: "/editor", file: "src/app/editor/page.tsx" },
  { route: "/historico", file: "src/app/historico/page.tsx" },
  { route: "/biblioteca", file: "src/app/biblioteca/page.tsx" },
  { route: "/marketplace", file: "src/app/marketplace/page.tsx" },
  { route: "/marketplace/novo", file: "src/app/marketplace/novo/page.tsx" },
  { route: "/admin", file: "src/app/admin/page.tsx" },
  { route: "/planos", file: "src/app/planos/page.tsx" },
  { route: "/contato", file: "src/app/contato/page.tsx" },
  { route: "/not-found", file: "src/app/not-found.tsx" },
];

const requiredFiles = [
  "src/config/routes.ts",
  "src/lib/navigation.ts",
  "data/bncc/processado/bncc-habilidades.json",
  "src/app/api/bncc/sugerir/route.ts",
  "src/types/bncc.ts",
  "src/config/billing.ts",
  "src/types/billing.ts",
];

let hasError = false;

console.log("");
console.log("Planify | Auditoria de rotas e arquivos");
console.log("---------------------------------------");

for (const item of routes) {
  const fullPath = path.join(root, item.file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? "OK " : "ERRO"} ${item.route.padEnd(18)} ${item.file}`);

  if (!exists) {
    hasError = true;
  }
}

console.log("");
console.log("Arquivos estruturais");
console.log("--------------------");

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? "OK " : "ERRO"} ${file}`);

  if (!exists) {
    hasError = true;
  }
}

console.log("");

if (hasError) {
  console.log("Auditoria encontrou arquivos ausentes.");
  process.exit(1);
}

console.log("Auditoria concluida com sucesso.");
