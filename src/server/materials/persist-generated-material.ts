import type { Json, TablesInsert } from "@/types/database";
import type { PersistGeneratedMaterialInput } from "@/types/generated-material";
import { extractBnccCodesFromPayload } from "../bncc/extract-bncc-codes";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getPrimarySchoolIdForUser } from "../schools/school-access";

const PREVIEW_MAX_LENGTH = 2000;

function buildPreview(...parts: Array<string | null | undefined>): string {
  const text = parts
    .map((part) => String(part || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");

  if (text.length <= PREVIEW_MAX_LENGTH) {
    return text;
  }

  return `${text.slice(0, PREVIEW_MAX_LENGTH - 1)}…`;
}

export type PersistGenerationParams = {
  userId: string;
  surface: PersistGeneratedMaterialInput["surface"];
  tipo: string;
  title?: string | null;
  contentHtml?: string | null;
  contentPreview?: string | null;
  pipeline?: string | null;
  qualityScore?: number | null;
  schoolId?: string | null;
  classId?: string | null;
  payload?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
};

export async function persistGeneratedMaterial(
  input: PersistGeneratedMaterialInput,
): Promise<string | null> {
  try {
    const supabase = getSupabaseAdminClient();

    const row: TablesInsert<"generated_materials"> = {
      user_id: input.userId,
      school_id: input.schoolId || null,
      class_id: input.classId || null,
      tipo: String(input.tipo || "").slice(0, 120),
      title: String(input.title || "Sem título").slice(0, 500),
      bncc_skill_codes: input.bnccSkillCodes,
      bncc_skills: (input.bnccSkills ?? []) as Json,
      content_preview: String(input.contentPreview || "").slice(0, PREVIEW_MAX_LENGTH),
      content_html: input.contentHtml || null,
      raw: input.raw,
      pipeline: input.pipeline || null,
      quality_score:
        typeof input.qualityScore === "number" ? input.qualityScore : null,
      surface: input.surface,
    };

    const { data, error } = await supabase
      .from("generated_materials")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.warn("planify:persist-generated-material failed", error.message);
      return null;
    }

    return (data as { id?: string } | null)?.id || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("planify:persist-generated-material failed", message);
    return null;
  }
}

export function persistGeneratedMaterialBestEffort(
  params: PersistGenerationParams,
): void {
  void persistGenerationRecord(params);
}

async function persistGenerationRecord(
  params: PersistGenerationParams,
): Promise<void> {
  try {
    const extracted = extractBnccCodesFromPayload({
      habilidadesSelecionadas: params.payload?.habilidadesSelecionadas,
      conteudos:
        params.result?.conteudos ??
        (params.result?.planejamento as Record<string, unknown> | undefined)
          ?.conteudos,
      estrutura: params.result?.estrutura ?? params.result,
      planejamento: params.result?.planejamento ?? params.result,
      contentHtml: params.contentHtml,
      contentPreview: params.contentPreview,
      raw: params.result ?? params.payload,
    });

    const schoolId =
      params.schoolId ||
      (params.userId ? await getPrimarySchoolIdForUser(params.userId) : null);

    const estrutura = (params.result?.estrutura ||
      params.result) as Record<string, unknown> | undefined;

    const title =
      params.title ||
      String(
        params.result?.titulo ||
          params.result?.title ||
          estrutura?.title ||
          estrutura?.titulo ||
          params.payload?.tema ||
          params.payload?.temaCentral ||
          params.tipo,
      ).trim();

    const preview =
      params.contentPreview ||
      buildPreview(
        String(params.result?.resumo || params.result?.summary || ""),
        String(estrutura?.summary || estrutura?.resumo || ""),
        params.contentHtml ? "" : String(params.result?.markdown || ""),
      );

    await persistGeneratedMaterial({
      userId: params.userId,
      schoolId,
      classId: params.classId || null,
      tipo: params.tipo,
      title: title || params.tipo,
      bnccSkillCodes: extracted.codes,
      bnccSkills: extracted.skills as Json,
      contentPreview: preview,
      contentHtml: params.contentHtml || null,
      raw: {
        payload: (params.payload || {}) as Json,
        result: (params.result || {}) as Json,
      } as Json,
      pipeline: params.pipeline || null,
      qualityScore: params.qualityScore ?? null,
      surface: params.surface,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("planify:persist-generated-material failed", message);
  }
}
