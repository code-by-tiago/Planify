import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../../server/auth/api-access";
import { resolveAdminAccess } from "../../../../../../server/auth/admin-access";
import { getSupabaseAdminClient } from "../../../../../../server/supabase/admin-client";
import {
  getMaterialLikesSummary,
  resolveCommunityAuthors,
} from "../../../../../../server/community/marketplace-social-service";
import {
  buildPreviewHtmlContent,
  isSlidePreviewHtml,
  resolveMarketplacePreviewKind,
  resolvePreviewDownloadFormats,
} from "../../../../../../server/marketplace/marketplace-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "marketplace-materiais";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const SIGNED_URL_TTL_SECONDS = 15 * 60;

type MarketplaceRow = {
  id: string;
  user_id: string | null;
  owner_email: string | null;
  author_name: string | null;
  title: string;
  description: string | null;
  etapa: string | null;
  ano_serie: string | null;
  componente: string | null;
  tipo_material: string | null;
  tema: string | null;
  tags: string[] | null;
  file_name: string | null;
  file_path: string | null;
  file_mime: string | null;
  file_size: number | null;
  is_published: boolean | null;
  downloads_count: number | null;
  created_at: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const { id } = await context.params;

  if (!id) {
    return jsonError("Material não informado.", 400);
  }

  const userId = String(access.access.user?.id || "").trim();
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const admin = await resolveAdminAccess(adminToken);

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

  const row = material as MarketplaceRow;
  const isOwner = Boolean(row.user_id && userId && row.user_id === userId);
  const canView = Boolean(row.is_published || isOwner || admin.isAdmin);

  if (!canView) {
    return jsonError("Material indisponível.", 403);
  }

  const previewKind = resolveMarketplacePreviewKind(row);
  let signedUrl: string | null = null;
  let htmlContent: string | null = null;
  let isSlidePreview = false;

  if (row.file_path) {
    if (previewKind === "pdf") {
      const { data } = await (supabase.storage.from(BUCKET_NAME) as any).createSignedUrl(
        row.file_path,
        SIGNED_URL_TTL_SECONDS,
      );

      signedUrl = data?.signedUrl || null;
    } else if (previewKind === "html") {
      const { data: fileData, error: downloadError } = await (
        supabase.storage.from(BUCKET_NAME) as any
      ).download(row.file_path);

      if (!downloadError && fileData) {
        const storedBuffer = Buffer.from(await fileData.arrayBuffer());
        htmlContent = buildPreviewHtmlContent({ storedBuffer, meta: row });
        isSlidePreview = Boolean(
          htmlContent && isSlidePreviewHtml(htmlContent, row),
        );
      }
    }
  }

  const [authors, likes] = await Promise.all([
    resolveCommunityAuthors(row.user_id ? [row.user_id] : []),
    getMaterialLikesSummary({
      materialIds: [row.id],
      viewerUserId: userId || null,
    }),
  ]);

  const author = row.user_id ? authors.get(row.user_id) : undefined;
  const like = likes.get(row.id) || { likesCount: 0, likedByMe: false };

  return NextResponse.json({
    success: true,
    material: {
      id: row.id,
      userId: row.user_id || "",
      authorName: author?.displayName || row.author_name || "Professor",
      authorAvatarUrl: author?.avatarUrl || null,
      title: row.title,
      description: row.description || "",
      etapa: row.etapa || "Ensino Fundamental",
      anoSerie: row.ano_serie || "Geral",
      componente: row.componente || "Multicomponente",
      tipoMaterial: row.tipo_material || "Material de apoio",
      tema: row.tema || "",
      tags: row.tags || [],
      fileName: row.file_name || "",
      fileMime: row.file_mime || "",
      fileSize: row.file_size || 0,
      downloadsCount: row.downloads_count || 0,
      createdAt: row.created_at,
      likesCount: like.likesCount,
      likedByMe: like.likedByMe,
    },
    preview: {
      kind: previewKind,
      signedUrl,
      htmlContent,
      isSlidePreview,
      downloadFormats: resolvePreviewDownloadFormats(previewKind),
    },
  });
}
