const fs = require("fs");
const path = require("path");

const root = process.cwd();
const file = path.join(root, "data", "bncc", "processado", "bncc-habilidades.json");

if (!fs.existsSync(file)) {
  console.error("Arquivo não encontrado:", file);
  process.exit(1);
}

const raw = fs.readFileSync(file, "utf8");
const habilidades = JSON.parse(raw);

if (!Array.isArray(habilidades)) {
  console.error("O JSON processado precisa ser um array.");
  process.exit(1);
}

const codigos = new Set();
let repetidas = 0;
let ef = 0;
let em = 0;
let invalidas = 0;

for (const habilidade of habilidades) {
  const codigo = String(habilidade.codigo || "").trim();

  if (!codigo || !String(habilidade.descricao || "").trim()) {
    invalidas++;
    continue;
  }

  if (codigos.has(codigo)) {
    repetidas++;
  }

  codigos.add(codigo);

  if (codigo.startsWith("EF")) ef++;
  if (codigo.startsWith("EM")) em++;
}

console.log("");
console.log("Validação BNCC Planify");
console.log("----------------------");
console.log("Total:", habilidades.length);
console.log("Ensino Fundamental EF:", ef);
console.log("Ensino Médio EM:", em);
console.log("Códigos únicos:", codigos.size);
console.log("Repetidas:", repetidas);
console.log("Inválidas:", invalidas);

if (invalidas > 0 || repetidas > 0) {
  process.exit(1);
}

console.log("");
console.log("Base BNCC processada validada com sucesso.");
