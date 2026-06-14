#!/usr/bin/env node
/**
 * Seed idempotente para QA da Comunidade Docente.
 * Run: npm run seed:comunidade-docente
 *
 * Requer SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Opcional: PLANIFY_OWNER_USER_ID (autor dos posts/materiais)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

loadEnvLocal();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BNCC_MINIMAL = [
  {
    code: "EF01LP01",
    description: "Reconhecer que textos são lidos e escritos da esquerda para a direita.",
    education_stage: "Ensino Fundamental",
    grade: "1º ano",
    subject: "Língua Portuguesa",
    is_active: true,
  },
  {
    code: "EF02MA01",
    description: "Comparar e ordenar números naturais de até duas ordens.",
    education_stage: "Ensino Fundamental",
    grade: "2º ano",
    subject: "Matemática",
    is_active: true,
  },
  {
    code: "EF03CI01",
    description: "Produzir hipóteses para problemas investigáveis.",
    education_stage: "Ensino Fundamental",
    grade: "3º ano",
    subject: "Ciências",
    is_active: true,
  },
  {
    code: "EF04HI01",
    description: "Identificar mudanças e permanências nas formas de organização social.",
    education_stage: "Ensino Fundamental",
    grade: "4º ano",
    subject: "História",
    is_active: true,
  },
  {
    code: "EF05GE01",
    description: "Descrever características do lugar onde vive e de outros lugares.",
    education_stage: "Ensino Fundamental",
    grade: "5º ano",
    subject: "Geografia",
    is_active: true,
  },
];

async function resolveAuthorId() {
  const configured = process.env.PLANIFY_OWNER_USER_ID?.trim();
  if (configured) return configured;

  const { data } = await supabase
    .from("profiles")
    .select("id,email")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    throw new Error("Nenhum perfil encontrado para seed. Defina PLANIFY_OWNER_USER_ID.");
  }

  console.log(`Autor seed: ${data.email || data.id}`);
  return data.id;
}

async function ensureBnccSkills() {
  const { count } = await supabase
    .from("bncc_skills")
    .select("id", { count: "exact", head: true });

  if ((count || 0) >= 3) {
    console.log(`BNCC OK (${count} habilidades).`);
    return;
  }

  const { error } = await supabase.from("bncc_skills").upsert(BNCC_MINIMAL, {
    onConflict: "code",
    ignoreDuplicates: true,
  });

  if (error) {
    console.warn(`BNCC seed parcial: ${error.message}`);
  } else {
    console.log("BNCC mínimo inserido para desafios.");
  }
}

async function ensureSamplePosts(authorId) {
  const { count } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  if ((count || 0) >= 2) {
    console.log(`Discussões OK (${count} publicadas).`);
    return;
  }

  const rows = [
    {
      author_id: authorId,
      title: "Trocando ideias sobre avaliação formativa",
      body: "Como vocês registram evidências de aprendizagem ao longo do bimestre?",
      disciplina: "Ciências",
      tags: ["avaliação", "prática"],
      is_published: true,
    },
    {
      author_id: authorId,
      title: "Materiais interdisciplinares para o 6º ano",
      body: "Compartilhando estratégias para integrar ciências e matemática.",
      disciplina: "Matemática",
      tags: ["interdisciplinar", "6º ano"],
      is_published: true,
    },
  ];

  const { error } = await supabase.from("community_posts").insert(rows);
  if (error) throw new Error(`Posts seed: ${error.message}`);
  console.log("Discussões de exemplo criadas.");
}

async function ensureSampleMaterials(authorId) {
  const { count } = await supabase
    .from("marketplace_materials")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  if ((count || 0) >= 2) {
    console.log(`Materiais marketplace OK (${count} publicados).`);
    return;
  }

  const rows = [
    {
      user_id: authorId,
      author_name: "Comunidade Planify",
      title: "Roteiro de aula — Ciências (amostra seed)",
      description: "Material de apoio para testes da Comunidade Docente.",
      etapa: "Ensino Fundamental",
      ano_serie: "6º ano",
      componente: "Ciências",
      tipo_material: "Material de apoio",
      tags: ["seed", "comunidade"],
      is_published: true,
      downloads_count: 3,
      file_mime: "application/pdf",
    },
    {
      user_id: authorId,
      author_name: "Comunidade Planify",
      title: "Atividades de matemática — frações (amostra seed)",
      description: "Conjunto de exercícios para validação do feed.",
      etapa: "Ensino Fundamental",
      ano_serie: "5º ano",
      componente: "Matemática",
      tipo_material: "Material de apoio",
      tags: ["seed", "comunidade"],
      is_published: true,
      downloads_count: 5,
      file_mime: "application/pdf",
    },
  ];

  const { error } = await supabase.from("marketplace_materials").insert(rows);
  if (error) throw new Error(`Materiais seed: ${error.message}`);
  console.log("Materiais de exemplo criados (sem arquivo físico — preview limitado).");
}

async function main() {
  const authorId = await resolveAuthorId();
  await ensureBnccSkills();
  await ensureSamplePosts(authorId);
  await ensureSampleMaterials(authorId);
  console.log("\nSeed Comunidade Docente concluído.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
