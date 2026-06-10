import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "@/server/auth/premium-access-service";
import { resolveAdminAccess } from "@/server/auth/admin-access";
import { isOwnerEmail } from "@/server/auth/owner-emails";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { convertSimpleDocxToHtml } from "@/server/docx/simple-docx-to-html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";
const BUCKET_NAME = "biblioteca-materiais";

function decodeJwtEmail(token: string | null) {
  if (!token || !token.includes(".")) return "";
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return String(json?.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

async function resolveOwnerByToken(token: string | null) {
  if (!token) return { authenticated: false, isOwner: false, email: "" };
  const jwtEmail = decodeJwtEmail(token);
  if (isOwnerEmail(jwtEmail)) {
    return { authenticated: true, isOwner: true, email: jwtEmail };
  }
  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase.auth.getUser(token);
    const email = String(data?.user?.email || "").trim().toLowerCase();
    return {
      authenticated: Boolean(email),
      isOwner: isOwnerEmail(email),
      email,
    };
  } catch {
    return { authenticated: false, isOwner: false, email: "" };
  }
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) return jsonError("Material não informado.", 400);

  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;

  const access = await verifyPremiumAccess(premiumToken);
  const admin = await resolveAdminAccess(adminToken);
  const owner = await resolveOwnerByToken(ownerToken || premiumToken || adminToken);

  const tokenEmail = decodeJwtEmail(premiumToken);
  const email = String(
    access.user?.email || owner.email || tokenEmail || admin.email || "",
  )
    .trim()
    .toLowerCase();
  const isOwner = Boolean(owner.isOwner || isOwnerEmail(email));
  const authenticated = Boolean(
    access.authenticated || admin.authenticated || owner.authenticated || email,
  );
  const premium = Boolean(access.premium || admin.isAdmin || isOwner);

  if (!authenticated) {
    return jsonError("Faça login para abrir materiais.", 401);
  }

  if (!premium) {
    return jsonError("A Biblioteca exige plano ativo.", 403);
  }

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("library_materials") as any;
  const { data: material, error: readError } = await table
    .select("id, title, description, file_path, file_mime, is_published")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return jsonError(`Erro ao localizar material: ${readError.message}`, 500);
  }

  if (!material) {
    return jsonError("Material não encontrado.", 404);
  }

  if (!material.is_published && !admin.isAdmin && !isOwner) {
    return jsonError("Material indisponível.", 403);
  }

  if (!material.file_path) {
    return jsonError("Este material não possui arquivo anexado.", 404);
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(material.file_path);

  if (downloadError || !fileData) {
    return jsonError(
      downloadError?.message || "Não foi possível baixar o arquivo.",
      500,
    );
  }

  const storedBuffer = Buffer.from(await fileData.arrayBuffer());
  const mime = String(material.file_mime || "").toLowerCase();
  const isDocx =
    mime.includes("wordprocessingml") || material.file_path.toLowerCase().endsWith(".docx");

  let html: string;

  if (isDocx) {
    html = convertSimpleDocxToHtml(storedBuffer, material.title);
  } else if (mime.includes("html") || material.file_path.toLowerCase().endsWith(".html")) {
    html = `<article class="planify-doc">${storedBuffer.toString("utf8")}</article>`;
  } else {
    return jsonError(
      "Pré-visualização no editor disponível para DOCX e HTML. Use Baixar arquivo para outros formatos.",
      415,
    );
  }

  return NextResponse.json({
    success: true,
    title: material.title,
    html,
    description: material.description || "",
  });
}
