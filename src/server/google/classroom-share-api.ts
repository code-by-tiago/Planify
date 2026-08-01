import { NextRequest, NextResponse } from "next/server";
import {
  logExportSuccess,
  parseExportTelemetryMetadata,
} from "@/server/export/export-error-service";
import {
  assertClassroomExportAllowed,
  recordClassroomExportDedup,
} from "./classroom-export-persistent-guard";
import { exportMaterialToGoogle } from "./google-export-service";
import { resolvePlanifyUserFromRequest } from "./google-auth";
import { getGoogleConfigStatus } from "./google-oauth";
import type { ClassroomAssignmentOptions, ClassroomShareType } from "./google-classroom";

type ClassroomShareBody = {
  title?: string;
  html?: string;
  description?: string;
  courseId?: string;
  courseIds?: string[];
  filename?: string;
  documentType?: string;
  shareType?: ClassroomShareType;
  dueDate?: string;
  dueTime?: string;
  maxPoints?: number | string | null;
};

function errorStatusFor(message: string): number {
  if (/login|nao conectada|n[aã]o conectada/i.test(message)) return 401;
  if (/autoriz|permiss|escopo|scope|reconecte/i.test(message)) return 403;
  return 400;
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: { message },
    },
    { status },
  );
}

function normalizeShareType(value: unknown): ClassroomShareType {
  return value === "assignment" ? "assignment" : "material";
}

function normalizeCourseIds(body: ClassroomShareBody): string[] {
  return [
    ...new Set(
      [
        ...(Array.isArray(body.courseIds) ? body.courseIds : []),
        body.courseId,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
}

function parseDueDate(value: unknown): ClassroomAssignmentOptions["dueDate"] {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseDueTime(value: unknown): ClassroomAssignmentOptions["dueTime"] {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

function parseMaxPoints(value: unknown): number | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function resolveAssignmentOptions(body: ClassroomShareBody): ClassroomAssignmentOptions | undefined {
  if (body.shareType !== "assignment") return undefined;

  const assignment: ClassroomAssignmentOptions = {};
  const dueDate = parseDueDate(body.dueDate);
  const dueTime = parseDueTime(body.dueTime);
  const maxPoints = parseMaxPoints(body.maxPoints);

  if (dueDate && dueTime) {
    assignment.dueDate = dueDate;
    assignment.dueTime = dueTime;
  }

  if (typeof maxPoints === "number") assignment.maxPoints = maxPoints;

  return Object.keys(assignment).length > 0 ? assignment : undefined;
}

export async function handleGoogleClassroomShareRequest(request: NextRequest) {
  const config = getGoogleConfigStatus();

  if (!config.configured) {
    return jsonError(
      "Integracao Google nao configurada. Veja docs/google/CONFIGURAR-GOOGLE-CLOUD.md",
      503,
    );
  }

  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return jsonError("Faca login e conecte sua conta Google.", 401);
  }

  const body = (await request.json().catch(() => null)) as ClassroomShareBody | null;

  if (!body) {
    return jsonError("Corpo da requisicao invalido.", 400);
  }

  const title = String(body.title || "").trim();
  const html = String(body.html || "").trim();
  const courseIds = normalizeCourseIds(body);
  const shareType = normalizeShareType(body.shareType);

  if (!title) {
    return jsonError("Informe o titulo do material.", 400);
  }

  if (!html) {
    return jsonError("Conteudo HTML vazio.", 400);
  }

  if (courseIds.length === 0) {
    return jsonError("Selecione ao menos uma turma do Google Classroom antes de publicar.", 400);
  }

  try {
    const dedupKey = await assertClassroomExportAllowed({
      userId: user.id,
      courseId: courseIds.join(","),
      title,
      html,
    });

    const startedAt = Date.now();
    const result = await exportMaterialToGoogle(user.id, {
      title,
      html,
      description: body.description,
      filename: body.filename,
      documentType: body.documentType,
      courseIds,
      shareType,
      assignment: resolveAssignmentOptions({ ...body, shareType }),
    });

    await recordClassroomExportDedup(user.id, dedupKey);

    logExportSuccess({
      surface: "google-classroom",
      toolTipo: body.documentType || "google-classroom",
      durationMs: Date.now() - startedAt,
      metadata: parseExportTelemetryMetadata({
        documentType: body.documentType,
        format: shareType === "assignment" ? "google-classroom-assignment" : "google-classroom-material",
      }),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel publicar no Google Classroom.";

    return jsonError(message, errorStatusFor(message));
  }
}
