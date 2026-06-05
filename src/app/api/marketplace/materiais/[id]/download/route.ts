import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../../../server/auth/premium-access-service";
import { resolveAdminAccess } from "../../../../../../server/auth/admin-access";
import { getSupabaseAdminClient } from "../../../../../../server/supabase/admin-client";
import {
  buildContentDispositionAttachment,
  parseMarketplaceExportFormat,
} from "../../../../../../server/marketplace/marketplace-download";
import { buildMarketplaceExportBuffer } from "../../../../../../server/marketplace/marketplace-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET_NAME = "marketplace-materiais";
const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";

type MarketplaceRow = {
  id: string;
  user_id: string | null;
  title: string;
  file_name: string | null;
  file_path: string | null;
  file_mime: string | null;
  is_published: boolean | null;
  downloads_count: number | null;
};

function getAccessToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  return (
    match?.[1]?.trim() ||
    request.cookies.get(PREMIUM_COOKIE_NAME)?.value ||
    null
  );
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return jsonError("Material não informado.", 400);
  }

  const accessToken = getAccessToken(request);
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const premium = await verifyPremiumAccess(accessToken);
  const admin = await resolveAdminAccess(adminToken);

  const authenticated = Boolean(premium.authenticated || admin.authenticated);
  const hasPremium = Boolean(premium.premium || admin.isAdmin);
  const userId = String(premium.user?.id || admin.userId || "").trim();

  if (!authenticated) {
    return jsonError("Faça login para baixar materiais.", 401);
  }

  if (!hasPremium) {
    return jsonError("O download exige plano ativo.", 403);
  }

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
  const canDownload = Boolean(row.is_published || isOwner || admin.isAdmin);

  if (!canDownload) {
    return jsonError("Material indisponível para download.", 403);
  }

  if (!row.file_path) {
    return jsonError("Este material não possui arquivo anexado.", 404);
  }

  const { data: fileData, error: downloadError } = await (
    supabase.storage.from(BUCKET_NAME) as any
  ).download(row.file_path);

  if (downloadError || !fileData) {
    return jsonError(
      downloadError?.message || "Não foi possível baixar o arquivo.",
      500,
    );
  }

  const format = parseMarketplaceExportFormat(
    request.nextUrl.searchParams.get("format"),
  );
  const storedBuffer = Buffer.from(await fileData.arrayBuffer());

  let exported: Awaited<ReturnType<typeof buildMarketplaceExportBuffer>>;

  try {
    exported = await buildMarketplaceExportBuffer({
      format,
      row,
      storedBuffer,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível gerar o arquivo solicitado.";

    return jsonError(message, 500);
  }

  await table
    .update({
      downloads_count: (row.downloads_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return new NextResponse(new Uint8Array(exported.buffer), {
    status: 200,
    headers: {
      "Content-Type": exported.contentType,
      "Content-Disposition": buildContentDispositionAttachment(
        exported.filename,
      ),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
