/**
 * Backfill reservatório didático a partir de bncc_skills (auto-approve).
 * Run: npm run backfill:pedagogical-bncc
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function hashPart(text, seed) {
  let h = seed;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function computeHash(normalized) {
  return (
    hashPart(normalized, 2166136261) +
    hashPart(normalized, 709607) +
    hashPart(normalized, 374761393) +
    hashPart(normalized, 3266489917)
  ).slice(0, 32);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeTopicSignature({ tema, componente, etapa, bnccCodigo }) {
  const normalized = [
    normalizeText(tema),
    normalizeText(componente || ""),
    normalizeText(etapa || ""),
    normalizeText(bnccCodigo || ""),
  ]
    .filter(Boolean)
    .join("|");
  return computeHash(normalized || "empty");
}

function computeContentHash(body, title = "") {
  return computeHash(`${normalizeText(title)}|${normalizeText(body)}`);
}

function buildBody(skill) {
  const lines = [`## Habilidade ${skill.code}`, "", skill.description];
  if (skill.subject) lines.push("", `**Componente:** ${skill.subject}`);
  if (skill.grade) lines.push(`**Ano/série:** ${skill.grade}`);
  if (skill.thematic_unit) lines.push(`**Unidade temática:** ${skill.thematic_unit}`);
  if (skill.knowledge_object) {
    lines.push(`**Objeto de conhecimento:** ${skill.knowledge_object}`);
  }
  return lines.join("\n");
}

async function main() {
  const { data: source, error: sourceError } = await supabase
    .from("pedagogical_sources")
    .select("id")
    .eq("slug", "bncc-skills")
    .maybeSingle();

  if (sourceError || !source) {
    console.error("Fonte bncc-skills não encontrada. Rode a migration 20260625 primeiro.");
    process.exit(1);
  }

  const pageSize = 500;
  let offset = 0;
  let inserted = 0;
  let skipped = 0;

  for (;;) {
    const { data: skills, error } = await supabase
      .from("bncc_skills")
      .select(
        "code,description,education_stage,grade,subject,thematic_unit,knowledge_object",
      )
      .eq("is_active", true)
      .order("code")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(error.message);
      process.exit(1);
    }

    if (!skills?.length) break;

    for (const skill of skills) {
      const code = String(skill.code).trim().toUpperCase();
      const body = buildBody(skill);
      const title = `BNCC ${code}`;
      const summary = String(skill.description).slice(0, 400);
      const topicSignature = computeTopicSignature({
        tema: code,
        componente: skill.subject,
        etapa: skill.education_stage,
        bnccCodigo: code,
      });
      const contentHash = computeContentHash(body, title);

      const { data: existing } = await supabase
        .from("pedagogical_cache_entries")
        .select("id, content_hash")
        .eq("topic_signature", topicSignature)
        .eq("source_id", source.id)
        .maybeSingle();

      if (existing?.content_hash === contentHash) {
        skipped += 1;
        continue;
      }

      const row = {
        topic_signature: topicSignature,
        content_hash: contentHash,
        title,
        summary,
        body_markdown: body,
        content_type: "definition",
        componente: skill.subject,
        ano_serie: skill.grade,
        etapa: skill.education_stage,
        bncc_codigos: [code],
        source_id: source.id,
        source_url: `https://basenacionalcomum.mec.gov.br/habilidade/${code}`,
        source_title: title,
        source_license: "Dados Abertos BR",
        review_status: "approved",
        format_applied: false,
        ai_tokens_used: 0,
        metadata: { backfill: true },
      };

      const { data: upserted, error: upsertError } = existing
        ? await supabase
            .from("pedagogical_cache_entries")
            .update(row)
            .eq("id", existing.id)
            .select("id")
            .single()
        : await supabase
            .from("pedagogical_cache_entries")
            .insert(row)
            .select("id")
            .single();

      if (upsertError) {
        console.warn(`Skip ${code}:`, upsertError.message);
        continue;
      }

      await supabase.from("pedagogical_cache_aliases").upsert(
        [
          { entry_id: upserted.id, alias_key: normalizeText(code), alias_type: "bncc" },
        ],
        { onConflict: "alias_key" },
      );

      inserted += 1;
    }

    if (skills.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`backfill:pedagogical-bncc OK — inserted/updated: ${inserted}, skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
