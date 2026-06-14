import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { downloadCommunityGroupMessageFile } from "@/server/community/community-group-messages-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const { id: groupId, messageId } = await params;

  try {
    const file = await downloadCommunityGroupMessageFile({
      groupId,
      messageId,
      viewerUserId: userId,
    });

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
        "X-Planify-Filename": file.fileName,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível baixar o arquivo.",
      404,
    );
  }
}
