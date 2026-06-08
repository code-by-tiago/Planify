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
    await client.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: "2MB",
    });
  } catch {
    // bucket pode já existir
  }

  return client;
}

export async function POST(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { message: "Faça login para alterar a foto." } },
      { status: 401 },
    );
  }

  const form = await request.formData();
  const file = form.get("avatar");

  if (!(file instanceof File) || !file.size) {
    return NextResponse.json(
      { ok: false, error: { message: "Selecione uma imagem válida." } },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: { message: "A imagem deve ter no máximo 2 MB." } },
      { status: 400 },
    );
  }

  const mime = file.type || "image/jpeg";
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime)) {
    return NextResponse.json(
      { ok: false, error: { message: "Use JPG, PNG ou WebP." } },
      { status: 400 },
    );
  }

  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = await ensureAvatarBucket();

  const { error: uploadError } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: true });

  if (uploadError) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: uploadError.message || "Não foi possível enviar a foto." },
      },
      { status: 500 },
    );
  }

  const { data: publicData } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const avatarUrl = publicData?.publicUrl || null;

  await updateCommunityProfile(user.id, { avatarUrl });

  const profile = await getCommunityProfileForUser({
    userId: user.id,
    email: user.email,
  });

  return NextResponse.json({ ok: true, profile, avatarUrl });
}
