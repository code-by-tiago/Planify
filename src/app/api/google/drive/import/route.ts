import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import { downloadDriveFile } from "@/server/google/google-drive";
import { getGoogleConfigStatus } from "@/server/google/google-oauth";
import { getValidGoogleAccessToken } from "@/server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = /\.(pdf|docx?|pptx?|png|jpe?g|webp)$/i;
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

function isAllowed(filename: string, mimeType: string): boolean {
  if (ALLOWED_EXTENSIONS.test(filename)) return true;
  const mime = mimeType.toLowerCase();
  return ALLOWED_MIMES.some((allowed) => mime === allowed || mime.startsWith(allowed));
}

/**
 * Baixa um arquivo escolhido no Google Picker e devolve o binário
 * para o composer anexar como File local.
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
    fileId?: string;
    filename?: string;
    mimeType?: string;
  } | null;

  const fileId = String(body?.fileId || "").trim();
  if (!fileId) return jsonError("Arquivo do Drive não informado.");

  try {
    const { accessToken } = await getValidGoogleAccessToken(googleUser.id);
    const downloaded = await downloadDriveFile({
      accessToken,
      fileId,
      filename: body?.filename,
      mimeType: body?.mimeType,
    });

    if (downloaded.buffer.length > MAX_BYTES) {
      return jsonError("Arquivo muito grande (máx. 25 MB).", 413);
    }

    if (!isAllowed(downloaded.filename, downloaded.mimeType)) {
      return jsonError(
        "Formato não suportado. Use PDF, DOC, DOCX, PPT, PPTX ou imagem.",
      );
    }

    return new NextResponse(new Uint8Array(downloaded.buffer), {
      status: 200,
      headers: {
        "Content-Type": downloaded.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(downloaded.filename)}`,
        "X-Planify-Filename": encodeURIComponent(downloaded.filename),
        "X-Planify-Mime": downloaded.mimeType,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível importar o arquivo do Drive.";
    // Google às vezes devolve JSON cru no erro — limpa para o professor.
    let friendly = message;
    try {
      const parsed = JSON.parse(message) as { error?: { message?: string } };
      if (parsed?.error?.message) friendly = parsed.error.message;
    } catch {
      // keep raw
    }
    if (/File not found|not found/i.test(friendly)) {
      friendly =
        "Arquivo não acessível. Feche o modal, clique em Drive de novo e escolha o arquivo outra vez.";
    }
    return jsonError(friendly, 400);
  }
}
