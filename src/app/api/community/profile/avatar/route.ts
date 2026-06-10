import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import {
  getCommunityProfileForUser,
  updateCommunityProfile,
} from "../../../../../server/community/community-profile-service";
import { getSupabaseAdminClient } from "../../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "profile-avatars";
const MAX_BYTES = 2 * 1024 * 1024;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

async function ensureAvatarBucket() {
  const client = getSupabaseAdminClient();

  try {
    const { data } = await client.storage.getBucket(AVATAR_BUCKET);
    if (data) {
      return client;
    }
  } catch {
    // segue
  }

  try {
    const { error } = await client.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: "2MB",
    });

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(error.message);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível preparar o armazenamento.";
    throw new Error(message);
  }

  return client;
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolvePlanifyUserFromRequest(request);

    if (!user) {
      return jsonError("Faça login para alterar a foto.", 401);
    }

    let form: FormData;

    try {
      form = await request.formData();
    } catch {
      return jsonError("Não foi possível ler o arquivo enviado.", 400);
    }

    const file = form.get("avatar");

    if (!(file instanceof File) || !file.size) {
      return jsonError("Selecione uma imagem válida.", 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("A imagem deve ter no máximo 2 MB.", 400);
    }

    const mime = file.type || "image/jpeg";
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime)) {
      return jsonError("Use JPG, PNG ou WebP.", 400);
    }

    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = await ensureAvatarBucket();

    const { error: uploadError } = await client.storage
      .from(AVATAR_BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: true });

    if (uploadError) {
      return jsonError(
        uploadError.message || "Não foi possível enviar a foto. Tente novamente.",
        500,
      );
    }

    const { data: publicData } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const avatarUrl = publicData?.publicUrl || null;

    if (!avatarUrl) {
      return jsonError("Foto enviada, mas o link público não foi gerado.", 500);
    }

    await updateCommunityProfile(user.id, { avatarUrl });

    const profile = await getCommunityProfileForUser({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({ ok: true, profile, avatarUrl });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Erro inesperado ao enviar a foto. Tente novamente.",
      500,
    );
  }
}
