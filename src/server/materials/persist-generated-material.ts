import type { Json, TablesInsert, TablesUpdate } from "@/types/database";
import type { PersistGeneratedMaterialInput } from "@/types/generated-material";
import { extractBnccCodesFromPayload } from "../bncc/extract-bncc-codes";
import { filterExtractedBnccByStage } from "../bncc/bncc-stage-filter";
import {
  resolveSchoolYear,
} from "../bncc/discipline-catalog";
import { suggestBnccByConteudos } from "../bncc/bncc-suggestion-engine";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getPrimarySchoolIdForUser } from "../schools/school-access";
import { upsertTeacherClass } from "../schools/teacher-classes-service";
import { createHash, randomUUID } from "node:crypto";

const PREVIEW_MAX_LENGTH = 2000;

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

function resolvePersistDiscipline(
  params: PersistGenerationParams,
): string | null {
  const payload = params.payload;
  return (
    params.discipline?.trim() ||
    String(
      payload?.discipline ||
        payload?.disciplina ||
        payload?.componenteCurricular ||
        payload?.componente ||
        "",
    ).trim() ||
    null
  );
}

async function inferBnccCodesWhenEmpty(
  extracted: ReturnType<typeof extractBnccCodesFromPayload>,
  params: PersistGenerationParams,
): Promise<ReturnType<typeof extractBnccCodesFromPayload>> {
  if (extracted.codes.length > 0) {
    return extracted;
  }

  const payload = params.payload;
  const componente = resolvePersistDiscipline(params);
  const tema = String(payload?.tema || payload?.temaCentral || "").trim();

  if (!componente || !tema) {
    return extracted;
  }

  try {
    const suggestion = await suggestBnccByConteudos({
      etapa: String(payload?.etapa || "").trim() || undefined,
      anoSerie: String(payload?.anoSerie || payload?.serie || "").trim() || undefined,
      areaConhecimento: String(payload?.areaConhecimento || "").trim() || undefined,
      componenteCurricular: componente,
      tema,
      conteudos: tema,
    });

    const etapa = String(payload?.etapa || "").trim();
    const anoSerie = String(payload?.anoSerie || payload?.serie || "").trim();

    const skills = (suggestion.habilidades || []).slice(0, 12);
    const filtered = filterExtractedBnccByStage(
      {
        codes: skills.map((skill) => skill.codigo),
        skills: skills.map((skill) => ({
          codigo: skill.codigo,
          descricao: skill.descricao,
          componente: skill.componente,
          etapa: skill.etapa,
          anoSerie: skill.anoSerie,
        })),
      },
      etapa,
      anoSerie,
    );
    const stageSkills = filtered.skills.slice(0, 8);
    if (stageSkills.length === 0) {
      return extracted;
    }

    return {
      codes: stageSkills.map((skill) => skill.codigo).sort(),
      skills: stageSkills,
    };
  } catch {
    return extracted;
  }
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
          console.warn("planify:persist-generated-material update failed", error.message);
          return null;
        }

        return existingId;
      }
    }

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

export async function persistGeneratedMaterialBestEffort(
  params: PersistGenerationParams,
): Promise<string | null> {
  try {
    return await persistGenerationRecord(params);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("planify:persist-generated-material best-effort failed", message);
    return null;
  }
}

async function persistGenerationRecord(
  params: PersistGenerationParams,
): Promise<string | null> {
  try {
    const htmlContent =
      params.contentHtml ||
      (typeof params.result?.html === "string" ? params.result.html : null);

    const etapa = String(params.payload?.etapa || "").trim();
    const anoSerie = String(
      params.payload?.anoSerie || params.payload?.serie || "",
    ).trim();

    const rawExtracted = await inferBnccCodesWhenEmpty(
      extractBnccCodesFromPayload({
        habilidadesSelecionadas: params.payload?.habilidadesSelecionadas,
        habilidadesBncc: params.payload?.habilidadesBncc,
        habilidadesBnccCodigos: params.payload?.habilidadesBnccCodigos,
        conteudos:
          params.payload?.conteudos ??
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
      }),
      params,
    );

    const extracted = filterExtractedBnccByStage(rawExtracted, etapa, anoSerie);

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "920c67",
      },
      body: JSON.stringify({
        sessionId: "920c67",
        runId: "audit",
        hypothesisId: "H1,H2",
        location: "persist-generated-material.ts:persistGenerationRecord",
        message: "bncc stage filter applied on persist",
        data: {
          etapa,
          anoSerie,
          rawCodes: rawExtracted.codes.slice(0, 12),
          filteredCodes: extracted.codes.slice(0, 12),
          dropped: rawExtracted.codes.length - extracted.codes.length,
          hasEfOnMedio:
            /m[eé]dio/i.test(etapa) &&
            rawExtracted.codes.some((code) => code.startsWith("EF")),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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

    const discipline = resolvePersistDiscipline(params);

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

    const materialId = await persistGeneratedMaterial({
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

    return materialId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("planify:persist-generated-material failed", message);
    return null;
  }
}
