import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import { getValidGoogleAccessToken } from "@/server/google/google-token-store";
import { uploadDocxAsGoogleDocument } from "@/server/google/google-drive";
import { getGoogleConfigStatus } from "@/server/google/google-oauth";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { resolveMarketplaceStoredKind } from "@/server/marketplace/marketplace-download";
import {
  jsonExportErrorResponse,
  logExportSuccess,
  parseExportTelemetryMetadata,
} from "@/server/export/export-error-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BUCKET_NAME = "marketplace-materiais";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

/**
 * Abre um material DOCX/DOC da Comunidade no Google Docs,
 * convertendo o arquivo original (não HTML).
 */
export async function POST(request: NextRequest) {
  const config = getGoogleConfigStatus();
  if (!config.configured) {
    return jsonError(
      "Integração Google não configurada. Veja docs/google/CONFIGURAR-GOOGLE-CLOUD.md",
      503,
    );
  }

  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const googleUser = await resolvePlanifyUserFromRequest(request);
  if (!googleUser) {
    return jsonError("Faça login e conecte sua conta Google.", 401);
  }

  const body = (await request.json().catch(() => null)) as {
    materialId?: string;
  } | null;
  const materialId = String(body?.materialId || "").trim();
  if (!materialId) return jsonError("Material não informado.");

  const supabase = getSupabaseAdminClient();
  const { data: material, error } = await supabase
    .from("marketplace_materials")
    .select("id,title,file_name,file_path,file_mime,is_published,user_id")
    .eq("id", materialId)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!material) return jsonError("Material não encontrado.", 404);

  const isOwner =
    Boolean(material.user_id) &&
    material.user_id === access.access.user?.id;
  if (!material.is_published && !isOwner) {
    return jsonError("Material indisponível.", 403);
  }

  const kind = resolveMarketplaceStoredKind({
    file_name: material.file_name,
    file_mime: material.file_mime,
  });
  if (kind !== "docx") {
    return jsonError("Abrir no Google Docs está disponível apenas para DOC/DOCX.");
  }
  if (!material.file_path) {
    return jsonError("Este material não possui arquivo anexado.", 404);
  }

  const { data: fileData, error: downloadError } = await (
    supabase.storage.from(BUCKET_NAME) as any
  ).download(material.file_path);

  if (downloadError || !fileData) {
    return jsonError(
      downloadError?.message || "Não foi possível ler o arquivo do material.",
      500,
    );
  }

  try {
    const startedAt = Date.now();
    const { accessToken, googleEmail } = await getValidGoogleAccessToken(googleUser.id);
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const filename =
      String(material.file_name || "").trim() ||
      `${String(material.title || "documento").slice(0, 80)}.docx`;
    const mime = String(material.file_mime || "").toLowerCase();
    const sourceMimeType =
      mime.includes("wordprocessingml") || mime.includes("msword")
        ? material.file_mime
        : null;

    const drive = await uploadDocxAsGoogleDocument({
      accessToken,
      filename,
      buffer,
      sourceMimeType,
    });

    const documentUrl =
      drive.webViewLink?.includes("docs.google.com/document") ||
      drive.webViewLink?.includes("/document/")
        ? drive.webViewLink
        : `https://docs.google.com/document/d/${drive.fileId}/edit`;

    logExportSuccess({
      surface: "google-docs",
      toolTipo: "community-docx",
      durationMs: Date.now() - startedAt,
      metadata: parseExportTelemetryMetadata({
        documentType: "community-docx",
        materialId,
        format: "google-docs",
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        documentUrl,
        drive: { ...drive, webViewLink: documentUrl },
        googleEmail,
      },
    });
  } catch (error) {
    return jsonExportErrorResponse(error, {
      surface: "google-docs",
      toolTipo: "community-docx",
    });
  }
}
