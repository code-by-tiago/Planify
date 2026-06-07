import type { Json, TablesInsert, TablesUpdate } from "@/types/database";
import type { PersistGeneratedMaterialInput } from "@/types/generated-material";
import { extractBnccCodesFromPayload } from "../bncc/extract-bncc-codes";
import { resolveSchoolYear } from "../bncc/discipline-catalog";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getPrimarySchoolIdForUser } from "../schools/school-access";
import { upsertTeacherClass } from "../schools/teacher-classes-service";
import { createHash, randomUUID } from "node:crypto";

const PREVIEW_MAX_LENGTH = 2000;

function debugPersistLog(
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "920c67",
    },
    body: JSON.stringify({
      sessionId: "920c67",
      runId: "bncc-persist",
      hypothesisId,
      location: "persist-generated-material.ts",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

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
  className?: string | null;
  discipline?: string | null;
  schoolYear?: number | null;
  payload?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
};

function resolveIdempotencyKey(
  payload?: Record<string, unknown> | null,
): string {
  const key = String(payload?.idempotencyKey || payload?.idempotency_key || "")
    .trim();
  if (key) return key.slice(0, 200);
  return createHash("sha256")
    .update(JSON.stringify(payload || {}))
    .digest("hex")
    .slice(0, 64);
}

function buildTrackingFields(
  input: PersistGeneratedMaterialInput,
): Pick<
  TablesInsert<"generated_materials">,
  | "material_type"
  | "request_payload"
  | "response_json"
  | "html_editor"
  | "model"
  | "input_tokens"
  | "output_tokens"
  | "credit_cost"
  | "request_hash"
  | "idempotency_key"
  | "status"
> {
  const idempotencyKey =
    input.idempotencyKey?.trim() || resolveIdempotencyKey(input.requestPayload);
  const requestHash = idempotencyKey;

  return {
    material_type: String(input.tipo || "material").slice(0, 120),
    request_payload: (input.requestPayload || {}) as Json,
    response_json: (input.responseJson || {}) as Json,
    html_editor: String(input.contentHtml || ""),
    model: String(input.pipeline || "planify").slice(0, 120),
    input_tokens: 0,
    output_tokens: 0,
    credit_cost: 0,
    request_hash: requestHash,
    idempotency_key: idempotencyKey || randomUUID(),
    status: "completed",
  };
}

function buildBnccRow(
  input: PersistGeneratedMaterialInput,
): TablesInsert<"generated_materials"> {
  return {
    user_id: input.userId,
    school_id: input.schoolId || null,
    class_id: input.classId || null,
    class_name: input.className?.trim() || null,
    discipline: input.discipline?.trim() || null,
    school_year: input.schoolYear ?? resolveSchoolYear(input.requestPayload),
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
    ...buildTrackingFields(input),
  };
}

export async function persistGeneratedMaterial(
  input: PersistGeneratedMaterialInput,
): Promise<string | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const row = buildBnccRow(input);
    const idempotencyKey = row.idempotency_key;

    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from("generated_materials")
        .select("id")
        .eq("user_id", input.userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      const existingId = (existing as { id?: string } | null)?.id;
      if (existingId) {
        const updateRow: TablesUpdate<"generated_materials"> = {
          school_id: row.school_id,
          class_id: row.class_id,
          class_name: row.class_name,
          discipline: row.discipline,
          school_year: row.school_year,
          tipo: row.tipo,
          title: row.title,
          bncc_skill_codes: row.bncc_skill_codes,
          bncc_skills: row.bncc_skills,
          content_preview: row.content_preview,
          content_html: row.content_html,
          raw: row.raw,
          pipeline: row.pipeline,
          quality_score: row.quality_score,
          surface: row.surface,
          response_json: row.response_json,
          html_editor: row.html_editor,
          model: row.model,
        };

        const { error } = await supabase
          .from("generated_materials")
          .update(updateRow)
          .eq("id", existingId);

        if (error) {
          debugPersistLog("update failed", { error: error.message }, "A");
          console.warn("planify:persist-generated-material update failed", error.message);
          return null;
        }

        debugPersistLog(
          "update ok",
          {
            id: existingId,
            codesCount: input.bnccSkillCodes.length,
            className: input.className,
            discipline: input.discipline,
            schoolYear: row.school_year,
          },
          "A",
        );
        return existingId;
      }
    }

    const { data, error } = await supabase
      .from("generated_materials")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      debugPersistLog("insert failed", { error: error.message }, "A");
      console.warn("planify:persist-generated-material failed", error.message);
      return null;
    }

    const id = (data as { id?: string } | null)?.id || null;
    debugPersistLog(
      "insert ok",
      {
        id,
        codesCount: input.bnccSkillCodes.length,
        className: input.className,
        discipline: input.discipline,
        schoolYear: row.school_year,
      },
      "A",
    );
    return id;
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
    const htmlContent =
      params.contentHtml ||
      (typeof params.result?.html === "string" ? params.result.html : null);

    const extracted = extractBnccCodesFromPayload({
      habilidadesSelecionadas: params.payload?.habilidadesSelecionadas,
      habilidadesBncc: params.payload?.habilidadesBncc,
      conteudos:
        params.result?.conteudos ??
        (params.result?.planejamento as Record<string, unknown> | undefined)
          ?.conteudos,
      estrutura: params.result?.estrutura ?? params.result,
      planejamento: params.result?.planejamento ?? params.result,
      contentHtml: htmlContent,
      contentPreview:
        params.contentPreview ||
        (typeof params.result?.markdown === "string"
          ? params.result.markdown
          : null),
      raw: params.result ?? params.payload,
    });

    debugPersistLog(
      "bncc extraction",
      {
        surface: params.surface,
        tipo: params.tipo,
        codes: extracted.codes,
        htmlLen: htmlContent ? htmlContent.length : 0,
      },
      "B",
    );

    const schoolId =
      params.schoolId ||
      (params.userId ? await getPrimarySchoolIdForUser(params.userId) : null);

    const className =
      params.className?.trim() ||
      String(params.payload?.className || params.payload?.turma || "").trim() ||
      null;

    if (params.userId && className && !schoolId && !params.classId) {
      await upsertTeacherClass(params.userId, className).catch(() => null);
    }

    const discipline =
      params.discipline?.trim() ||
      String(
        params.payload?.discipline ||
          params.payload?.disciplina ||
          params.payload?.componenteCurricular ||
          params.payload?.componente ||
          "",
      ).trim() ||
      null;

    const schoolYear =
      params.schoolYear ?? resolveSchoolYear(params.payload ?? undefined);

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
      className,
      discipline,
      schoolYear,
      idempotencyKey: resolveIdempotencyKey(params.payload),
      requestPayload: params.payload ?? null,
      responseJson: params.result ?? null,
      tipo: params.tipo,
      title: title || params.tipo,
      bnccSkillCodes: extracted.codes,
      bnccSkills: extracted.skills as Json,
      contentPreview: preview,
      contentHtml: params.contentHtml || htmlContent,
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
