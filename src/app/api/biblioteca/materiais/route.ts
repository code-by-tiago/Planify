import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";
import { resolveAdminAccess } from "../../../../server/auth/admin-access";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";
const BUCKET_NAME = "biblioteca-materiais";

type LibraryMaterialRow = {
  id: string;
  title: string;
  description: string | null;
  etapa: string | null;
  area_conhecimento?: string | null;
  ano_serie?: string | null;
  categoria: string | null;
  tipo_material?: string | null;
  componente: string | null;
  tema?: string | null;
  finalidade: string | null;
  nivel_dificuldade?: string | null;
  duracao?: string | null;
  habilidades_bncc?: string[] | null;
  observacoes?: string | null;
  tags: string[] | null;
  file_name: string | null;
  file_path: string | null;
  file_mime: string | null;
  file_size: number | null;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function ownerEmails() {
  return [
    process.env.PLANIFY_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    "ts162351@gmail.com",
  ]
    .join(",")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function decodeJwtEmail(token: string | null) {
  if (!token || !token.includes(".")) {
    return "";
  }

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
  if (!token) {
    return {
      authenticated: false,
      isOwner: false,
      email: "",
    };
  }

  const jwtEmail = decodeJwtEmail(token);

  if (jwtEmail && ownerEmails().includes(jwtEmail)) {
    return {
      authenticated: true,
      isOwner: true,
      email: jwtEmail,
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase.auth.getUser(token);
    const email = String(data?.user?.email || "").trim().toLowerCase();

    return {
      authenticated: Boolean(email),
      isOwner: Boolean(email && ownerEmails().includes(email)),
      email,
    };
  } catch {
    return {
      authenticated: false,
      isOwner: false,
      email: "",
    };
  }
}

function jsonError(message: string, status = 400, code = "error") {
  return NextResponse.json(
    {
      success: false,
      error: { message, code },
      items: [],
    },
    { status },
  );
}

async function withSignedUrl(row: LibraryMaterialRow) {
  const supabase = getSupabaseAdminClient();
  let signedUrl: string | null = null;

  if (row.file_path) {
    const { data } = await (supabase.storage.from(BUCKET_NAME) as any).createSignedUrl(
      row.file_path,
      60 * 60,
    );

    signedUrl = data?.signedUrl || null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    etapa: row.etapa || "Ensino Fundamental",
    areaConhecimento: row.area_conhecimento || "",
    anoSerie: row.ano_serie || "Geral",
    categoria: row.categoria || "Material",
    tipoMaterial: row.tipo_material || row.categoria || "Material",
    componente: row.componente || "Multicomponente",
    tema: row.tema || "",
    finalidade: row.finalidade || "Apoio pedagógico",
    nivelDificuldade: row.nivel_dificuldade || "",
    duracao: row.duracao || "",
    habilidadesBncc: row.habilidades_bncc || [],
    observacoes: row.observacoes || "",
    tags: row.tags || [],
    fileName: row.file_name || "",
    filePath: row.file_path || "",
    fileMime: row.file_mime || "",
    fileSize: row.file_size || 0,
    isPublished: Boolean(row.is_published),
    signedUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolvePremiumOrOwnerAccess(request: NextRequest) {
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;

  const access = await verifyPremiumAccess(premiumToken);
  const admin = await resolveAdminAccess(adminToken);
  const owner = await resolveOwnerByToken(ownerToken || premiumToken || adminToken);

  const tokenEmail = decodeJwtEmail(premiumToken);
  const email = String(
    access.user?.email ||
      owner.email ||
      tokenEmail ||
      admin.email ||
      "",
  )
    .trim()
    .toLowerCase();

  const isOwner = Boolean(owner.isOwner || (email && ownerEmails().includes(email)));

  return {
    authenticated: Boolean(access.authenticated || admin.authenticated || owner.authenticated || email),
    premium: Boolean(access.premium || admin.isAdmin || isOwner),
    isOwner,
    isAdmin: Boolean(admin.isAdmin || isOwner),
    email,
  };
}

export async function GET(request: NextRequest) {
  const access = await resolvePremiumOrOwnerAccess(request);

  if (!access.authenticated) {
    return jsonError(
      "Faça login para acessar a Biblioteca Premium.",
      401,
      "not_authenticated",
    );
  }

  if (!access.premium) {
    return jsonError(
      "A Biblioteca Premium é liberada apenas para usuários com plano ativo.",
      403,
      "premium_required",
    );
  }

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("library_materials") as any;

  const { data, error } = await table
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(
      `Erro ao carregar materiais da Biblioteca Premium: ${error.message}`,
      500,
      "database_error",
    );
  }

  const items = await Promise.all(
    ((data || []) as LibraryMaterialRow[]).map((row) => withSignedUrl(row)),
  );

  return NextResponse.json({
    success: true,
    items,
    source: "admin_uploads",
    access,
  });
}
