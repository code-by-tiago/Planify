import { getSupabaseAdminClient } from "../supabase/admin-client";

<<<<<<< HEAD
=======
const BUCKET_NAME = "marketplace-materiais";
const IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60;

>>>>>>> origin/aplicar-melhorias-na-producao
export type CommunityPostAttachment = {
  id: string;
  materialId: string;
  fileName: string;
  fileMime: string | null;
  title: string;
  fileType: "pdf" | "docx" | "pptx" | "image";
<<<<<<< HEAD
=======
  /** URL assinada para preview inline (imagens). */
  previewUrl: string | null;
>>>>>>> origin/aplicar-melhorias-na-producao
};

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

<<<<<<< HEAD
function resolveFileType(
  mime: string | null | undefined,
  fileName: string,
): CommunityPostAttachment["fileType"] {
  const lower = `${mime || ""} ${fileName}`.toLowerCase();
  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("ppt") || lower.includes("presentation")) return "pptx";
  if (lower.includes("png") || lower.includes("jpeg") || lower.includes("jpg") || lower.includes("webp") || lower.includes("image")) {
    return "image";
  }
  return "docx";
}

=======
export function resolveAttachmentFileType(
  mime: string | null | undefined,
  fileName: string,
): CommunityPostAttachment["fileType"] {
  const mimeLower = String(mime || "").toLowerCase();
  const nameLower = String(fileName || "").toLowerCase();

  if (
    mimeLower.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(nameLower)
  ) {
    return "image";
  }
  if (mimeLower.includes("pdf") || nameLower.endsWith(".pdf")) return "pdf";
  if (
    mimeLower.includes("presentation") ||
    mimeLower.includes("powerpoint") ||
    /\.pptx?$/i.test(nameLower)
  ) {
    return "pptx";
  }
  if (
    mimeLower.includes("word") ||
    mimeLower.includes("document") ||
    /\.docx?$/i.test(nameLower)
  ) {
    return "docx";
  }
  // fallback genérico de documento
  return "docx";
}

async function signedPreviewUrl(filePath: string | null | undefined): Promise<string | null> {
  if (!filePath) return null;
  const supabase = getSupabaseAdminClient();
  const { data } = await (supabase.storage.from(BUCKET_NAME) as any).createSignedUrl(
    filePath,
    IMAGE_SIGNED_URL_TTL_SECONDS,
  );
  return data?.signedUrl || null;
}

>>>>>>> origin/aplicar-melhorias-na-producao
export async function linkPostAttachments(params: {
  authorId: string;
  postId: string;
  attachments: Array<{
    materialId: string;
    fileName: string;
    fileMime?: string | null;
    sortOrder?: number;
  }>;
}): Promise<{ linked: number }> {
  if (params.attachments.length === 0) return { linked: 0 };

  const supabase = getSupabaseAdminClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select("id,author_id")
    .eq("id", params.postId)
    .maybeSingle();

  if (!post) throw new Error("Discussão não encontrada.");
  if (post.author_id !== params.authorId) {
    throw new Error("Apenas o(a) autor(a) pode anexar materiais nesta discussão.");
  }

  const materialIds = params.attachments.map((item) => item.materialId);
  const { data: materials } = await supabase
    .from("marketplace_materials")
    .select("id,user_id")
    .in("id", materialIds);

  const ownedIds = new Set(
    (materials || [])
      .filter((row) => row.user_id === params.authorId)
      .map((row) => row.id as string),
  );

  const valid = params.attachments.filter((item) => ownedIds.has(item.materialId));
  if (valid.length === 0) {
    throw new Error("Nenhum material válido para vincular à discussão.");
  }

  const rows = valid.map((item, index) => ({
    post_id: params.postId,
    material_id: item.materialId,
    file_name: item.fileName.slice(0, 255),
    file_mime: item.fileMime || null,
    sort_order: item.sortOrder ?? index,
  }));

  const { error } = await (supabase as any).from("community_post_attachments").insert(rows);

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Anexos em atualização no servidor. Tente novamente em instantes.");
    }
    throw new Error(error.message || "Não foi possível vincular os anexos.");
  }

  return { linked: rows.length };
}

export async function listPostAttachments(postId: string): Promise<CommunityPostAttachment[]> {
  const supabase = getSupabaseAdminClient();

  const { data: rows, error } = await (supabase as any)
    .from("community_post_attachments")
    .select("id,material_id,file_name,file_mime,sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(error.message);
  }

  if (!rows?.length) return [];

  const materialIds = rows.map((row: { material_id: string }) => row.material_id as string);
  const { data: materials } = await supabase
    .from("marketplace_materials")
<<<<<<< HEAD
    .select("id,title,file_mime,is_published")
=======
    .select("id,title,file_mime,file_path,file_name,is_published")
>>>>>>> origin/aplicar-melhorias-na-producao
    .in("id", materialIds);

  const materialMap = new Map(
    (materials || [])
      .filter((row) => row.is_published !== false)
      .map((row) => [row.id as string, row]),
  );

<<<<<<< HEAD
  return rows
    .map((row: {
=======
  const mapped = await Promise.all(
    rows.map(async (row: {
>>>>>>> origin/aplicar-melhorias-na-producao
      id: string;
      material_id: string;
      file_name: string;
      file_mime: string | null;
    }) => {
      const material = materialMap.get(row.material_id as string);
      if (!material) return null;
<<<<<<< HEAD
      const fileName = (row.file_name as string) || "anexo";
      const fileMime = (row.file_mime as string | null) || (material.file_mime as string | null);
=======
      const fileName =
        (row.file_name as string) ||
        (material.file_name as string | null) ||
        "anexo";
      const fileMime =
        (row.file_mime as string | null) || (material.file_mime as string | null);
      const fileType = resolveAttachmentFileType(fileMime, fileName);
      const previewUrl =
        fileType === "image"
          ? await signedPreviewUrl(material.file_path as string | null)
          : null;

>>>>>>> origin/aplicar-melhorias-na-producao
      return {
        id: row.id as string,
        materialId: row.material_id as string,
        fileName,
        fileMime,
        title: (material.title as string) || fileName,
<<<<<<< HEAD
        fileType: resolveFileType(fileMime, fileName),
      };
    })
    .filter((item: CommunityPostAttachment | null): item is CommunityPostAttachment => Boolean(item));
=======
        fileType,
        previewUrl,
      } satisfies CommunityPostAttachment;
    }),
  );

  return mapped.filter((item): item is CommunityPostAttachment => Boolean(item));
>>>>>>> origin/aplicar-melhorias-na-producao
}
