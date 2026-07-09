import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { convertSimpleDocxToHtml } from "@/server/docx/simple-docx-to-html";
import {
  buildPreviewHtmlContent,
  resolveMarketplacePreviewKind,
} from "@/server/marketplace/marketplace-preview";
import { saveHistoryItemToDB } from "@/server/history/history-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET_NAME = "marketplace-materiais";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

function buildFallbackCloneHtml(material: {
  title?: string | null;
  description?: string | null;
  etapa?: string | null;
  ano_serie?: string | null;
  componente?: string | null;
  tipo_material?: string | null;
  tema?: string | null;
}): string {
  return `
    <article class="planify-doc" style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>${material.title || "Material"}</h1>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Etapa</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${material.etapa || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Ano/Série</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${material.ano_serie || "Geral"}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Componente</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${material.componente || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tipo</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${material.tipo_material || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tema</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${material.tema || ""}</td></tr>
      </table>
      <h2>Descrição pedagógica</h2>
      <p>${material.description || ""}</p>
    </article>
  `;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = String(access.access.user?.id || "").trim();
  if (!userId) return jsonError("Usuário não autenticado.", 401);

  const { id } = await context.params;
  if (!id) return jsonError("Material não informado.", 400);

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("marketplace_materials") as any;

  const { data: material, error: readError } = await table
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return jsonError(`Erro ao localizar material: ${readError.message}`, 500);
  }
  if (!material) {
    return jsonError("Material não encontrado.", 404);
  }
  if (!material.is_published && material.user_id !== userId) {
    return jsonError("Material indisponível.", 404);
  }

  const previewKind = resolveMarketplacePreviewKind(material);
  let htmlContent: string | null = null;

  if (material.file_path && (previewKind === "html" || previewKind === "docx")) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(material.file_path);

      if (!downloadError && fileData) {
        const storedBuffer = Buffer.from(await fileData.arrayBuffer());
        if (previewKind === "docx") {
          htmlContent = convertSimpleDocxToHtml(storedBuffer, material.title || "Material");
        } else {
          htmlContent = buildPreviewHtmlContent({ storedBuffer, meta: material });
        }
      }
    } catch {
      htmlContent = null;
    }
  }

  if (previewKind === "pdf" || previewKind === "binary") {
    return jsonError(
      "Clonar e Editar disponível para DOCX e HTML. Use Baixar para outros formatos.",
      422,
    );
  }

  if (!htmlContent || htmlContent.trim().length < 20) {
    htmlContent = buildFallbackCloneHtml(material);
  }

  const title = `Cópia — ${String(material.title || "Material").trim()}`;
  const historyItemId = randomUUID();
  const now = new Date().toISOString();

  await saveHistoryItemToDB({
    userId,
    item: {
      id: historyItemId,
      title,
      subtitle: "Clonado da Comunidade",
      source: "marketplace",
      type: "material:comunidade-clone",
      status: "rascunho",
      contentPreview: htmlContent.replace(/<[^>]+>/g, " ").slice(0, 240),
      content: htmlContent,
      raw: {
        source: "community_clone",
        marketplaceId: id,
        schoolLabel: null,
        classLabel: null,
        folderId: null,
      },
      createdAt: now,
      updatedAt: now,
    },
  });

  const nextDownloads = Number(material.downloads_count || 0) + 1;
  await table.update({ downloads_count: nextDownloads }).eq("id", id);

  return NextResponse.json({
    success: true,
    clone: {
      historyItemId,
      title,
      html: htmlContent,
      downloadsCount: nextDownloads,
    },
  });
}
