/**
 * Seed da Biblioteca Premium (materiais reais em library_materials + Storage).
 * Run: npm run seed:biblioteca-pacotes
 * Atualizar pacotes já inseridos: npm run seed:biblioteca-pacotes:force
 *
 * NOTA: O cache pedagógico (pedagogical_cache_entries / seed:pedagogical-themes)
 * alimenta contexto para geração com IA — NÃO aparece em /biblioteca.
 * Esta seed popula a Biblioteca Premium com arquivos DOCX baixáveis.
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_PACKAGES } from "./data/biblioteca-seed-packages.mjs";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET_NAME = "biblioteca-materiais";
const FORCE_UPDATE = process.argv.includes("--force");
const SEED_VERSION = "v2";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function loadTsModule(relativePath) {
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
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate);
        } catch {
          // try next
        }
      }
    }
    if (specifier.startsWith(".")) {
      const base = join(dirname(sourcePath), specifier);
      for (const candidate of [base, `${base}.ts`, `${base}.js`]) {
        try {
          return require(candidate);
        } catch {
          // try next
        }
      }
    }
    return require(specifier);
  };

  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    transpiled,
  );
  evaluator(module.exports, localRequire, module, dirname(sourcePath), sourcePath);
  return module.exports;
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { buildSimpleDocx } = loadTsModule("src/server/docx/simple-docx-builder.ts");

function guessAreaByComponent(componente) {
  const value = componente.toLowerCase();
  if (value.includes("matem")) return "Matemática";
  if (value.includes("ciên") || value.includes("cien")) return "Ciências da Natureza";
  if (value.includes("hist") || value.includes("geo")) return "Ciências Humanas";
  if (value.includes("portugu")) return "Linguagens";
  return "Multicomponente";
}

function seedUuid(slug) {
  const hash = createHash("sha256").update(`planify-biblioteca-seed:${slug}`).digest("hex");
  const variant = ((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${variant}${hash.slice(18, 20)}-${hash.slice(20, 32)}`;
}

function contentHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function findExisting(title, componente) {
  const { data, error } = await supabase
    .from("library_materials")
    .select("id, title, componente, file_path, file_size")
    .eq("title", title)
    .eq("componente", componente)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao consultar material "${title}": ${error.message}`);
  }

  return data;
}

function buildRow(pkg, buffer, hash, storagePath, fileName, id) {
  return {
    id,
    title: pkg.title,
    description: pkg.description,
    etapa: pkg.etapa,
    area_conhecimento: guessAreaByComponent(pkg.componente),
    ano_serie: pkg.anoSerie,
    categoria: pkg.categoria,
    tipo_material: pkg.tipoMaterial,
    componente: pkg.componente,
    tema: pkg.tema,
    finalidade: pkg.finalidade,
    nivel_dificuldade: pkg.nivelDificuldade,
    duracao: pkg.duracao,
    habilidades_bncc: pkg.habilidadesBncc,
    observacoes: `Seed Planify ${SEED_VERSION} · hash:${hash.slice(0, 12)}`,
    tags: pkg.tags,
    file_name: fileName,
    file_path: storagePath,
    file_mime: DOCX_MIME,
    file_size: buffer.byteLength,
    is_published: true,
    updated_at: new Date().toISOString(),
  };
}

async function seedPackage(pkg) {
  const existing = await findExisting(pkg.title, pkg.componente);
  if (existing && !FORCE_UPDATE) {
    return { status: "skipped", reason: "title+componente" };
  }

  const spec = pkg.buildSpec();
  const buffer = buildSimpleDocx(spec);
  const hash = contentHash(buffer);
  const storagePath = `seed/${pkg.slug}.docx`;
  const fileName = `${pkg.slug}.docx`;
  const id = existing?.id ?? seedUuid(pkg.slug);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: DOCX_MIME,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload falhou (${pkg.slug}): ${uploadError.message}`);
  }

  const row = buildRow(pkg, buffer, hash, storagePath, fileName, id);

  if (existing) {
    const { id: _rowId, ...updateFields } = row;
    const { error: updateError } = await supabase
      .from("library_materials")
      .update(updateFields)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(`Update falhou (${pkg.slug}): ${updateError.message}`);
    }

    return { status: "updated", bytes: buffer.byteLength };
  }

  const { error: insertError } = await supabase.from("library_materials").insert(row);

  if (insertError) {
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(`Insert falhou (${pkg.slug}): ${insertError.message}`);
  }

  return { status: "inserted", bytes: buffer.byteLength };
}

async function main() {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  if (FORCE_UPDATE) {
    console.log(`Modo --force: atualizando pacotes existentes (${SEED_VERSION}).\n`);
  }

  for (const pkg of SEED_PACKAGES) {
    try {
      const result = await seedPackage(pkg);
      if (result.status === "skipped") {
        skipped += 1;
        console.log(`  skip: ${pkg.title}`);
      } else if (result.status === "updated") {
        updated += 1;
        console.log(`  update: ${pkg.title} (${result.bytes} bytes)`);
      } else {
        inserted += 1;
        console.log(`  ok: ${pkg.title} (${result.bytes} bytes)`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ title: pkg.title, message });
      console.warn(`  fail: ${pkg.title} — ${message}`);
    }
  }

  console.log(
    `\nseed:biblioteca-pacotes — ${inserted} inserido(s), ${updated} atualizado(s), ${skipped} ignorado(s), ${failed} falha(s).`,
  );

  if (failures.length > 0) {
    console.log("Falhas:", failures);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
