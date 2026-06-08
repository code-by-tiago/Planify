/**
 * Simula formato Supabase (DB) no motor BNCC unificado
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const moduleCache = new Map();

function normalizeStageCode(value, code = "") {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (normalized.includes("fundamental") || code.toUpperCase().startsWith("EF")) return "ensino_fundamental";
  if (normalized.includes("medio") || code.toUpperCase().startsWith("EM")) return "ensino_medio";
  return "unknown";
}

function rowToBnccSkill(row) {
  const code = row.code.trim().toUpperCase();
  return {
    id: code,
    codigo: code,
    descricao: row.description,
    etapa: normalizeStageCode(row.education_stage, code),
    ano: row.grade || undefined,
    serie: row.grade || undefined,
    componente: row.subject || undefined,
    areaConhecimento: row.knowledge_area || undefined,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    fonte: "bncc_skills",
  };
}

const bnccJson = JSON.parse(
  fs.readFileSync(path.join(root, "data/bncc/processado/bncc-habilidades.json"), "utf8"),
);

// Simula linhas como no Supabase (education_stage label, grade string)
const dbSkills = bnccJson.map((item) =>
  rowToBnccSkill({
    code: item.codigo,
    description: item.descricao,
    education_stage:
      item.etapa === "ensino_medio"
        ? "Ensino Médio"
        : item.etapa === "ensino_fundamental"
          ? "Ensino Fundamental"
          : "Educação Infantil",
    grade: item.serie || item.ano || null,
    subject: item.componente || null,
    knowledge_area: item.areaConhecimento || null,
    keywords: item.keywords || [],
  }),
);

function loadTsModule(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);
  const ts = require("typescript");
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier === "./bncc-catalog-service") {
      return { getCachedBnccSkills: async () => dbSkills, fetchBnccSkillsFromDb: async () => dbSkills, countBnccSkillsInDb: async () => dbSkills.length };
    }
    if (specifier === "./bncc-service") return loadTsModule("src/server/bncc/bncc-service.ts");
    if (specifier === "./discipline-catalog") return loadTsModule("src/server/bncc/discipline-catalog.ts");
    if (specifier === "./bncc-term-expansion") return loadTsModule("src/server/bncc/bncc-term-expansion.ts");
    if (specifier.startsWith(".")) {
      const resolved = path.join(path.dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (fs.existsSync(candidate) && candidate.endsWith(".ts")) {
          return loadTsModule(path.relative(root, candidate).replace(/\\/g, "/"));
        }
      }
    }
    return require(specifier);
  };
  new Function("exports", "require", "module", "__dirname", "__filename", transpiled)(
    module.exports, localRequire, module, path.dirname(sourcePath), sourcePath,
  );
  moduleCache.set(relativePath, module.exports);
  return module.exports;
}

const { filterBnccSkillsByContext, rankBnccSkillsForContent } = loadTsModule("src/server/bncc/bncc-service.ts");
const { suggestBnccByConteudos } = loadTsModule("src/server/bncc/bncc-suggestion-engine.ts");

const payload = {
  etapa: "Ensino Médio",
  anoSerie: "3ª série",
  areaConhecimento: "Linguagens e suas Tecnologias",
  componenteCurricular: "Língua Portuguesa",
  conteudos: "REVISÃO: Semântica e Sintaxe: Sintaxe do período composto\nOrações coordenadas\nCoesão e coerência textuais",
};

const context = {
  etapa: payload.etapa,
  anoSerie: payload.anoSerie,
  componenteCurricular: payload.componenteCurricular,
};

const filtered = filterBnccSkillsByContext(dbSkills, context);
console.log("DB_SKILLS", dbSkills.length, "FILTERED", filtered.length, "SAMPLE", filtered.slice(0, 3).map((s) => s.codigo));

for (const conteudo of payload.conteudos.split("\n")) {
  const ranked = rankBnccSkillsForContent(filtered, context, conteudo, { limit: 3 });
  console.log(conteudo.slice(0, 50), "=>", ranked.map((r) => r.skill.codigo).join(", ") || "(vazio)");
}

// Simula bug Supabase: só 1000 primeiras linhas (só EF, sem EM)
const truncated = dbSkills.slice(0, 1000);
const truncatedFiltered = filterBnccSkillsByContext(truncated, context);
console.log("TRUNCATED_1000_EM_FILTERED", truncatedFiltered.length);

const result = await suggestBnccByConteudos(payload);
console.log("SUGGEST_TOTAL", result.total, "GROUPS", result.conteudos.map((g) => ({ c: g.conteudo.slice(0, 30), n: g.habilidades.length, codes: g.habilidades.map((h) => h.codigo) })));
