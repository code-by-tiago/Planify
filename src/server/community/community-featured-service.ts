import { getSupabaseAdminClient } from "../supabase/admin-client";
import { normalizeDocenteDisciplina } from "@/lib/community/docente-utils";
import type { DocenteMaterial } from "@/lib/community/docente-types";
import { resolveCommunityAuthors } from "./marketplace-social-service";

export type FeaturedSource = "admin" | "import" | "community" | "external";

export type AdminFeaturedMaterial = {
  id: string;
  title: string;
  description: string | null;
  tipoMaterial: string;
  componente: string | null;
  authorName: string | null;
  isFeatured: boolean;
  featuredAt: string | null;
  featuredSource: FeaturedSource;
  externalUrl: string | null;
  downloadsCount: number;
  createdAt: string | null;
  isPublished: boolean;
};

function fileTypeFromMime(mime: string | null | undefined): DocenteMaterial["fileType"] {
  const value = String(mime || "").toLowerCase();
  if (value.includes("pdf")) return "pdf";
  if (value.includes("presentation") || value.includes("powerpoint")) return "pptx";
  if (value.includes("image")) return "image";
  return "docx";
}

export async function listFeaturedCommunityMaterials(limit = 12): Promise<DocenteMaterial[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("marketplace_materials")
    .select(
      "id,user_id,author_name,title,componente,ano_serie,tipo_material,tags,file_mime,downloads_count,created_at,external_url,featured_source",
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("featured_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.warn("[community-featured] list failed:", error.message);
    return [];
  }

  const rows = data || [];
  const authorIds = rows.map((row) => String(row.user_id || "")).filter(Boolean);
  const authorMap = await resolveCommunityAuthors(authorIds);

  return Promise.all(
    rows.map(async (row) => {
      const userId = String(row.user_id || "admin");
      const author = authorMap.get(userId);
      const downloadsCount = Number(row.downloads_count || 0);
      return {
        id: String(row.id),
        title: String(row.title || "Conteúdo em alta"),
        disciplina: normalizeDocenteDisciplina(row.componente as string | null),
        anoSerie: String(row.ano_serie || "Geral"),
        author: {
          id: userId,
          name: author?.displayName || String(row.author_name || "Planify"),
          avatarUrl: author?.avatarUrl || null,
          specialty: "Planify",
          materialsCount: 0,
          followersCount: 0,
          reputation: 0,
          badges: [],
        },
        tipoMaterial: String(row.tipo_material || row.title || "Material"),
        componenteRaw: row.componente ? String(row.componente) : undefined,
        tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
        viewsCount: downloadsCount,
        downloadsCount,
        likesCount: 0,
        likedByMe: false,
        savedByMe: false,
        fileType: fileTypeFromMime(row.file_mime as string | null),
        externalUrl: (row.external_url as string | null) || null,
        featuredSource:
          (String(row.featured_source || "admin") as DocenteMaterial["featuredSource"]) || "admin",
      } satisfies DocenteMaterial;
    }),
  );
}

export async function listAdminFeaturedMaterials(params?: {
  onlyFeatured?: boolean;
  limit?: number;
}): Promise<AdminFeaturedMaterial[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("marketplace_materials")
    .select(
      "id,title,description,tipo_material,componente,author_name,is_featured,featured_at,featured_source,external_url,downloads_count,created_at,is_published",
    )
    .order("featured_at", { ascending: false, nullsFirst: false })
    .limit(params?.limit || 60);

  if (params?.onlyFeatured) {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || "Não foi possível listar conteúdos.");

  return (data || []).map((row) => ({
    id: String(row.id),
    title: String(row.title || ""),
    description: (row.description as string | null) || null,
    tipoMaterial: String(row.tipo_material || "Material"),
    componente: (row.componente as string | null) || null,
    authorName: (row.author_name as string | null) || null,
    isFeatured: Boolean(row.is_featured),
    featuredAt: (row.featured_at as string | null) || null,
    featuredSource: (String(row.featured_source || "community") as FeaturedSource) || "community",
    externalUrl: (row.external_url as string | null) || null,
    downloadsCount: Number(row.downloads_count || 0),
    createdAt: (row.created_at as string | null) || null,
    isPublished: Boolean(row.is_published),
  }));
}

export async function setMaterialFeatured(params: {
  materialId: string;
  featured: boolean;
  featuredSource?: FeaturedSource;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("marketplace_materials")
    .update({
      is_featured: params.featured,
      featured_at: params.featured ? new Date().toISOString() : null,
      featured_source: params.featuredSource || "admin",
    })
    .eq("id", params.materialId);

  if (error) throw new Error(error.message || "Não foi possível atualizar o destaque.");
}

export async function createExternalFeaturedMaterial(params: {
  adminUserId: string;
  adminEmail?: string | null;
  title: string;
  description?: string;
  tipoMaterial?: string;
  componente?: string;
  externalUrl: string;
  authorName?: string;
}): Promise<AdminFeaturedMaterial> {
  const supabase = getSupabaseAdminClient();
  const title = params.title.trim();
  const externalUrl = params.externalUrl.trim();
  if (!title) throw new Error("Informe o título do conteúdo.");
  if (!externalUrl) throw new Error("Informe a URL do conteúdo importado.");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(externalUrl);
  } catch {
    throw new Error("URL inválida.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Use apenas URLs https:// para conteúdos externos.");
  }

  const { data, error } = await supabase
    .from("marketplace_materials")
    .insert({
      user_id: params.adminUserId,
      owner_email: params.adminEmail || null,
      author_name: params.authorName?.trim() || "Planify",
      title,
      description: params.description?.trim() || "Conteúdo destacado pela Planify.",
      tipo_material: params.tipoMaterial?.trim() || "Importado",
      componente: params.componente?.trim() || "Multidisciplinar",
      etapa: "Geral",
      ano_serie: "Geral",
      tags: ["destaque", "admin"],
      is_published: true,
      is_featured: true,
      featured_at: new Date().toISOString(),
      featured_source: "external",
      external_url: externalUrl,
      downloads_count: 0,
    })
    .select(
      "id,title,description,tipo_material,componente,author_name,is_featured,featured_at,featured_source,external_url,downloads_count,created_at,is_published",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível importar o conteúdo.");
  }

  return {
    id: String(data.id),
    title: String(data.title || ""),
    description: (data.description as string | null) || null,
    tipoMaterial: String(data.tipo_material || "Importado"),
    componente: (data.componente as string | null) || null,
    authorName: (data.author_name as string | null) || null,
    isFeatured: Boolean(data.is_featured),
    featuredAt: (data.featured_at as string | null) || null,
    featuredSource: (String(data.featured_source || "external") as FeaturedSource) || "external",
    externalUrl: (data.external_url as string | null) || null,
    downloadsCount: Number(data.downloads_count || 0),
    createdAt: (data.created_at as string | null) || null,
    isPublished: Boolean(data.is_published),
  };
}
