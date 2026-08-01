/**
 * Importa data/bncc/processado/bncc-habilidades.json → public.bncc_skills (Supabase).
 * Uso: node scripts/bncc/import-bncc-skills.mjs
 * Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const file = path.join(root, "data", "bncc", "processado", "bncc-habilidades.json");

function toEducationStageLabel(etapa, code = "") {
  const normalized = String(etapa || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const upper = String(code).toUpperCase();
  if (normalized.includes("fundamental") || upper.startsWith("EF")) {
    return "Ensino Fundamental";
  }
  if (normalized.includes("medio") || upper.startsWith("EM")) {
    return "Ensino Médio";
  }
  if (normalized.includes("infantil") || upper.startsWith("EI")) {
    return "Educação Infantil";
  }
  return String(etapa || "").trim() || "Ensino Fundamental";
}

function toRow(item) {
  const code = String(item.codigo || item.code || item.id || "")
    .trim()
    .toUpperCase();
  const description = String(item.descricao || item.description || "").trim();
  if (!code || !description) return null;

  return {
    code,
    description,
    education_stage: toEducationStageLabel(item.etapa, code),
    grade: String(item.ano || item.grade || item.serie || "").trim() || null,
    subject:
      String(item.componente || item.componenteCurricular || item.subject || "")
        .trim() || null,
    knowledge_area:
      String(item.areaConhecimento || item.knowledgeArea || "").trim() || null,
    thematic_unit:
      String(item.unidadeTematica || item.thematicUnit || "").trim() || null,
    knowledge_object:
      String(item.objetoConhecimento || item.knowledgeObject || "").trim() ||
      null,
    keywords: Array.isArray(item.keywords)
      ? item.keywords.map((k) => String(k).trim()).filter(Boolean)
      : [],
    metadata: {},
    is_active: true,
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error("Arquivo não encontrado:", file);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(raw)) {
  console.error("JSON deve ser um array de habilidades.");
  process.exit(1);
}

const rows = raw.map(toRow).filter(Boolean);
console.log(`Preparando ${rows.length} habilidades para upsert...`);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const batchSize = 100;
let inserted = 0;
let failed = 0;

for (let i = 0; i < rows.length; i += batchSize) {
  const batch = rows.slice(i, i + batchSize);
  const { error } = await supabase.from("bncc_skills").upsert(batch, {
    onConflict: "code",
  });

  if (error) {
    console.error(`Batch ${i / batchSize + 1} falhou:`, error.message);
    failed += batch.length;
  } else {
    inserted += batch.length;
    console.log(`Batch ${i / batchSize + 1}: ${batch.length} ok`);
  }
}

const { count } = await supabase
  .from("bncc_skills")
  .select("id", { count: "exact", head: true })
  .eq("is_active", true);

console.log("\nImportação concluída");
console.log("Upserted:", inserted);
console.log("Failed:", failed);
console.log("Total ativo em bncc_skills:", count ?? "?");

process.exit(failed > 0 ? 1 : 0);
