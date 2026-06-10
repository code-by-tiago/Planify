import {
  countQuestionsInResponseJson,
  normalizeMaterialEstrutura,
} from "@/lib/materiais/normalize-material-estrutura";
import type { MaterialAIOutput } from "@/types/ai";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type MaterialEstruturaMeta = {
  tipo: string;
  title: string;
  discipline: string | null;
  bncc_skill_codes: string[];
  created_at: string;
};

type GeneratedMaterialRow = {
  id: string;
  user_id: string;
  tipo: string;
  title: string;
  discipline: string | null;
  bncc_skill_codes: string[] | null;
  response_json: unknown;
  created_at: string;
};

export async function getMaterialEstruturaForUser(params: {
  userId: string;
  materialId: string;
}): Promise<
  | { ok: true; estrutura: MaterialAIOutput | null; meta: MaterialEstruturaMeta }
  | { ok: false; status: 404 | 403; message: string }
> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("generated_materials")
    .select(
      "id, user_id, tipo, title, discipline, bncc_skill_codes, response_json, created_at",
    )
    .eq("id", params.materialId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { ok: false, status: 404, message: "Material não encontrado." };
  }

  const row = data as GeneratedMaterialRow;

  if (row.user_id !== params.userId) {
    return { ok: false, status: 403, message: "Acesso negado a este material." };
  }

  const { estrutura } = normalizeMaterialEstrutura(row.response_json);

  return {
    ok: true,
    estrutura,
    meta: {
      tipo: row.tipo,
      title: row.title,
      discipline: row.discipline,
      bncc_skill_codes: row.bncc_skill_codes || [],
      created_at: row.created_at,
    },
  };
}

export type ImportableQuestionSource = {
  id: string;
  title: string;
  tipo: string;
  discipline: string | null;
  questaoCount: number;
  createdAt: string;
};

export async function listImportableQuestionSourcesForUser(params: {
  userId: string;
  tipos?: string[];
  limit?: number;
}): Promise<ImportableQuestionSource[]> {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(params.limit || 50, 1), 100);
  const tiposSet = params.tipos?.length ? new Set(params.tipos) : null;

  const { data, error } = await supabase
    .from("generated_materials")
    .select("id, title, tipo, discipline, response_json, created_at")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(limit * 4);

  if (error) {
    throw new Error(error.message);
  }

  const fontes: ImportableQuestionSource[] = [];

  for (const row of (data || []) as GeneratedMaterialRow[]) {
    if (tiposSet && !tiposSet.has(row.tipo)) continue;

    const questaoCount = countQuestionsInResponseJson(row.response_json);
    if (questaoCount <= 0) continue;

    fontes.push({
      id: row.id,
      title: row.title,
      tipo: row.tipo,
      discipline: row.discipline,
      questaoCount,
      createdAt: row.created_at,
    });

    if (fontes.length >= limit) break;
  }

  return fontes;
}
