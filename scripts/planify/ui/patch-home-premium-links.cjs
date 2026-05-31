const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const targets = [
  path.join(root, "src", "app", "page.tsx"),
  path.join(root, "src", "app", "HomeClient.tsx"),
  path.join(root, "src", "components", "HomeClient.tsx"),
];

const premiumLinks = {
  "/dashboard": "/login?premium=required&redirect=%2Fdashboard",
  "/planejamentos": "/login?premium=required&redirect=%2Fplanejamentos",
  "/materiais": "/login?premium=required&redirect=%2Fmateriais",
  "/editor": "/login?premium=required&redirect=%2Feditor",
  "/historico": "/login?premium=required&redirect=%2Fhistorico",
  "/biblioteca": "/login?premium=required&redirect=%2Fbiblioteca",
  "/marketplace": "/login?premium=required&redirect=%2Fmarketplace",
};

for (const file of targets) {
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, "utf8");
  const original = text;

  for (const [from, to] of Object.entries(premiumLinks)) {
    text = text
      .replaceAll(`href="${from}"`, `href="${to}"`)
      .replaceAll(`href='${from}'`, `href='${to}'`);
  }

  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    console.log(`OK: links premium da home ajustados em ${path.relative(root, file)}`);
  } else {
    console.log(`OK: nenhum link premium direto encontrado em ${path.relative(root, file)}`);
  }
}
