import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";
import { resolveAdminAccess } from "../../../../server/auth/admin-access";
import { isOwnerEmail } from "../../../../server/auth/owner-emails";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";
import { resolveMarketplaceStoredMime } from "../../../../server/marketplace/marketplace-download";
import {
  getMaterialCommentsBatch,
  getMaterialLikesSummary,
  getTopLikedMaterialIdsLast7Days,
  resolveCommunityAuthors,
} from "../../../../server/community/marketplace-social-service";
import { listAcceptedFriendUserIds } from "../../../../server/community/community-friends-service";
import { getSavedMaterialIds } from "../../../../server/community/community-saved-materials-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";
const BUCKET_NAME = "marketplace-materiais";

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
  updated_at: string | null;
};

function decodeJwtPayload(token: string | null): any | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function decodeJwtEmail(token: string | null) {
  const payload = decodeJwtPayload(token);

  return String(payload?.email || "").trim().toLowerCase();
}

function decodeJwtUserId(token: string | null) {
  const payload = decodeJwtPayload(token);

  return String(payload?.sub || "").trim();
}

async function resolveOwnerByToken(token: string | null) {
  if (!token) {
    return {
      authenticated: false,
      isOwner: false,
      email: "",
      userId: "",
    };
  }

  const jwtEmail = decodeJwtEmail(token);
  const jwtUserId = decodeJwtUserId(token);

  if (isOwnerEmail(jwtEmail)) {
    return {
      authenticated: true,
      isOwner: true,
      email: jwtEmail,
      userId: jwtUserId,
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase.auth.getUser(token);
    const email = String(data?.user?.email || "").trim().toLowerCase();
    const userId = String(data?.user?.id || "").trim();

    return {
      authenticated: Boolean(email || userId),
      isOwner: isOwnerEmail(email),
      email,
      userId,
    };
  } catch {
    return {
      authenticated: false,
      isOwner: false,
      email: "",
      userId: "",
    };
  }
}

/** Cookie ou Authorization Bearer (sessão Supabase no editor). */
function getAccessToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  return (
    match?.[1]?.trim() ||
    request.cookies.get("planify_session")?.value ||
    request.cookies.get(PREMIUM_COOKIE_NAME)?.value ||
    null
  );
}

/** O bucket marketplace-materiais não aceita text/html; normalizamos no upload. */
function resolveUploadContentType(file: File): string {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (
    type.includes("text/html") ||
    name.endsWith(".html") ||
    name.endsWith(".htm")
  ) {
    return "text/plain";
  }

  return file.type || "application/octet-stream";
}

async function resolveMarketplaceAccess(request: NextRequest) {
  const accessToken = getAccessToken(request);
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;

  const premium = await verifyPremiumAccess(accessToken);
  const admin = await resolveAdminAccess(adminToken);
  const owner = await resolveOwnerByToken(ownerToken || accessToken || adminToken);

  const tokenEmail = decodeJwtEmail(accessToken);
  const tokenUserId = decodeJwtUserId(accessToken);

  const email = String(
    premium.user?.email ||
      owner.email ||
      tokenEmail ||
      admin.email ||
      "",
  )
    .trim()
    .toLowerCase();

  const userId = String(
    premium.user?.id ||
      owner.userId ||
      tokenUserId ||
      admin.userId ||
      "",
  ).trim();

  const isOwner = Boolean(owner.isOwner || isOwnerEmail(email));
  const authenticated = Boolean(
    premium.authenticated || admin.authenticated || owner.authenticated || email || userId,
  );
  const hasPremium = Boolean(premium.premium || admin.isAdmin || isOwner);

  return {
    authenticated,
    premium: hasPremium,
    isOwner,
    isAdmin: Boolean(admin.isAdmin || isOwner),
    email,
    userId,
  };
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

function normalizeText(value: FormDataEntryValue | null, fallback = "") {
  return String(value || fallback).trim();
}

function parseList(value: string): string[] {
  return value
    .split(/\n|,|;/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function safeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 120) || "material-marketplace"
  );
}

async function withSignedUrl(row: MarketplaceRow) {
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
    userId: row.user_id || "",
    ownerEmail: row.owner_email || "",
    authorName: row.author_name || "Professor",
    title: row.title,
    description: row.description || "",
    etapa: row.etapa || "Ensino Fundamental",
    anoSerie: row.ano_serie || "Geral",
    componente: row.componente || "Multicomponente",
    tipoMaterial: row.tipo_material || "Material de apoio",
    tema: row.tema || "",
    tags: row.tags || [],
    fileName: row.file_name || "",
    filePath: row.file_path || "",
    fileMime: row.file_mime || "",
    fileSize: row.file_size || 0,
    isPublished: Boolean(row.is_published),
    downloadsCount: row.downloads_count || 0,
    signedUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorAvatarUrl: null as string | null,
    likesCount: 0,
    likedByMe: false,
  };
}

async function enrichMarketplaceItems(
  items: Awaited<ReturnType<typeof withSignedUrl>>[],
  viewerUserId?: string | null,
) {
  const userIds = items.map((item) => item.userId).filter(Boolean);
  const materialIds = items.map((item) => item.id);

  const [authors, likes, comments, savedIds] = await Promise.all([
    resolveCommunityAuthors(userIds),
    getMaterialLikesSummary({ materialIds, viewerUserId }),
    getMaterialCommentsBatch(materialIds),
    viewerUserId
      ? getSavedMaterialIds({ userId: viewerUserId, materialIds })
      : Promise.resolve(new Set<string>()),
  ]);

  return items.map((item) => {
    const author = authors.get(item.userId);
    const like = likes.get(item.id) || { likesCount: 0, likedByMe: false };
    const itemComments = comments.get(item.id) || [];

    return {
      ...item,
      authorName: author?.displayName || item.authorName,
      authorAvatarUrl: author?.avatarUrl || null,
      likesCount: like.likesCount,
      likedByMe: like.likedByMe,
      commentsCount: itemComments.length,
      comments: itemComments,
      savedByMe: savedIds.has(item.id),
    };
  });
}

export async function GET(request: NextRequest) {
  const access = await resolveMarketplaceAccess(request);

  if (!access.authenticated) {
    return jsonError("Faça login para acessar a Comunidade.", 401, "not_authenticated");
  }

  if (!access.premium) {
    return jsonError(
      "A Comunidade é liberada apenas para usuários com plano ativo.",
      403,
      "premium_required",
    );
  }

  const params = request.nextUrl.searchParams;
  const mine = params.get("mine") === "true";
  const savedOnly = params.get("saved") === "true";
  const featuredWeek = params.get("featured") === "week";
  const friendsOnly = params.get("friendsOnly") === "true";
  const componenteFilter = String(params.get("componente") || "").trim();
  const etapaFilter = String(params.get("etapa") || "").trim();
  const tipoFilter = String(params.get("tipoMaterial") || "").trim();
  const tagFilter = String(params.get("tag") || "").trim().toLowerCase();
  const temaFilter = String(params.get("tema") || "").trim().toLowerCase();

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("marketplace_materials") as any;

  let query = table.select("*").order("created_at", { ascending: false });

  if (mine) {
    query = query.eq("user_id", access.userId);
  } else {
    query = query.eq("is_published", true);
  }

  if (componenteFilter && componenteFilter !== "Todos") {
    query = query.eq("componente", componenteFilter);
  }

  if (etapaFilter && etapaFilter !== "Todas") {
    query = query.eq("etapa", etapaFilter);
  }

  if (tipoFilter && tipoFilter !== "Todos") {
    query = query.eq("tipo_material", tipoFilter);
  }

  if (temaFilter) {
    query = query.ilike("tema", `%${temaFilter}%`);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError(
      `Erro ao carregar Comunidade: ${error.message}`,
      500,
      "database_error",
    );
  }

  let rows = (data || []) as MarketplaceRow[];

  if (friendsOnly && access.userId) {
    const friendIds = await listAcceptedFriendUserIds(access.userId);
    const allowed = new Set([...friendIds, access.userId]);
    rows = rows.filter((row) => row.user_id && allowed.has(row.user_id));
  }

  if (tagFilter) {
    rows = rows.filter((row) =>
      (row.tags || []).some((tag) => String(tag).toLowerCase().includes(tagFilter)),
    );
  }

  if (savedOnly && access.userId) {
    const savedIds = await getSavedMaterialIds({ userId: access.userId });
    rows = rows.filter((row) => savedIds.has(row.id));
  }

  const baseItems = await Promise.all(rows.map((row) => withSignedUrl(row)));
  const items = await enrichMarketplaceItems(baseItems, access.userId || null);

  let featured: typeof items = [];

  if (featuredWeek) {
    const topIds = await getTopLikedMaterialIdsLast7Days(5);
    if (topIds.length) {
      const featuredRows = rows.filter((row) => topIds.includes(row.id));
      const orderMap = new Map(topIds.map((id, index) => [id, index]));
      featuredRows.sort(
        (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99),
      );
      const featuredBase = await Promise.all(featuredRows.map((row) => withSignedUrl(row)));
      featured = await enrichMarketplaceItems(featuredBase, access.userId || null);
    }
  }

  return NextResponse.json({
    success: true,
    items,
    featured,
    access,
  });
}

export async function POST(request: NextRequest) {
  const access = await resolveMarketplaceAccess(request);

  if (!access.authenticated) {
    return jsonError("Faça login para publicar na Comunidade.", 401, "not_authenticated");
  }

  if (!access.premium) {
    return jsonError(
      "A publicação na Comunidade exige plano ativo.",
      403,
      "premium_required",
    );
  }

  if (!access.userId) {
    return jsonError(
      "Não foi possível identificar sua conta. Saia e entre novamente, depois tente publicar.",
      401,
      "user_missing",
    );
  }

  const formData = await request.formData();

  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const etapa = normalizeText(formData.get("etapa"), "Ensino Fundamental");
  const anoSerie = normalizeText(formData.get("anoSerie"), "Geral");
  const componente = normalizeText(formData.get("componente"), "Multicomponente");
  const tipoMaterial = normalizeText(formData.get("tipoMaterial"), "Material de apoio");
  const tema = normalizeText(formData.get("tema"), title);
  const authorName = normalizeText(formData.get("authorName"), "Professor");
  const tags = parseList(normalizeText(formData.get("tags")));
  const isPublished = normalizeText(formData.get("isPublished"), "true") !== "false";
  const fileValue = formData.get("file");

  if (!title) {
    return jsonError("Informe o título do material.");
  }

  if (!description) {
    return jsonError("Informe uma descrição breve do material.");
  }

  if (!(fileValue instanceof File)) {
    return jsonError("Anexe o arquivo do material.");
  }

  if (fileValue.size <= 0) {
    return jsonError("O arquivo anexado está vazio.");
  }

  const supabase = getSupabaseAdminClient();
  const id = randomUUID();
  const originalName = safeFilename(fileValue.name || "material");
  const extension = originalName.includes(".")
    ? originalName.split(".").pop()
    : "bin";
  const storagePath = `${access.userId || "owner"}/${id}/${safeFilename(title)}.${extension}`;
  const arrayBuffer = await fileValue.arrayBuffer();
  const uploadBody = new Uint8Array(arrayBuffer);

  const uploadContentType = resolveUploadContentType(fileValue);

  const uploadResult = await (supabase.storage.from(BUCKET_NAME) as any).upload(
    storagePath,
    uploadBody,
    {
      contentType: uploadContentType,
      upsert: false,
    },
  );

  if (uploadResult.error) {
    return jsonError(
      `Erro ao enviar arquivo: ${uploadResult.error.message}. Confirme se o bucket marketplace-materiais existe no Supabase.`,
      500,
      "upload_error",
    );
  }

  const row = {
    id,
    user_id: access.userId || null,
    owner_email: access.email || null,
    author_name: authorName,
    title,
    description,
    etapa,
    ano_serie: anoSerie,
    componente,
    tipo_material: tipoMaterial,
    tema,
    tags,
    file_name: fileValue.name || originalName,
    file_path: storagePath,
    file_mime: resolveMarketplaceStoredMime(fileValue),
    file_size: fileValue.size,
    is_published: isPublished,
    downloads_count: 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as any)
    .from("marketplace_materials")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    await (supabase.storage.from(BUCKET_NAME) as any).remove([storagePath]);

    return jsonError(
      `Erro ao salvar material: ${error.message}. Rode o SQL 09-19-1-marketplace-real.sql no Supabase.`,
      500,
      "database_error",
    );
  }

  const baseItem = await withSignedUrl(data as MarketplaceRow);
  const [item] = await enrichMarketplaceItems([baseItem], access.userId || null);

  return NextResponse.json({
    success: true,
    item,
  });
}

export async function DELETE(request: NextRequest) {
  const access = await resolveMarketplaceAccess(request);

  if (!access.authenticated || !access.premium) {
    return jsonError("Acesso negado.", 403, "forbidden");
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return jsonError("ID do material não informado.");
  }

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("marketplace_materials") as any;

  const { data: material, error: readError } = await table
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return jsonError(`Erro ao localizar material: ${readError.message}`, 500, "read_error");
  }

  if (!material) {
    return jsonError("Material não encontrado.", 404, "not_found");
  }

  const isOwner = material.user_id && material.user_id === access.userId;
  const canDelete = Boolean(isOwner || access.isAdmin || access.isOwner);

  if (!canDelete) {
    return jsonError("Você só pode remover materiais publicados por você.", 403, "forbidden");
  }

  if (material.file_path) {
    await (supabase.storage.from(BUCKET_NAME) as any).remove([material.file_path]);
  }

  const { error } = await table.delete().eq("id", id);

  if (error) {
    return jsonError(`Erro ao remover material: ${error.message}`, 500, "delete_error");
  }

  return NextResponse.json({
    success: true,
  });
}
