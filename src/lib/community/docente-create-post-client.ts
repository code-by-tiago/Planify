import type { DocenteCreatePostInput } from "@/lib/community/docente-types";

type CreatePostResponse = {
  ok?: boolean;
  postId?: string;
  linked?: number;
  error?: { message?: string };
};

type UploadMaterialResponse = {
  success?: boolean;
  item?: { id?: string };
  error?: { message?: string };
};

async function deleteUploadedMaterials(materialIds: string[]): Promise<void> {
  await Promise.all(
    materialIds.map(async (materialId) => {
      await fetch(`/api/marketplace/materiais?id=${encodeURIComponent(materialId)}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => undefined);
    }),
  );
}

export async function submitDocenteCreatePost(params: {
  input: DocenteCreatePostInput;
  viewerName: string;
}): Promise<{ postId: string }> {
  const { input, viewerName } = params;

  const ensuredTitle = (() => {
    const raw = String(input.title || "").trim();
    if (raw.length >= 3) return raw.slice(0, 300);
    const fromFile = String(input.files[0]?.name || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (fromFile.length >= 3) return fromFile.slice(0, 300);
    const fromBody = String(input.body || "").trim();
    if (fromBody.length >= 3) return fromBody.slice(0, 80);
    return input.files.length > 0 ? "Publicação com anexo" : "Publicação na comunidade";
  })();

  if (input.files.length === 0) {
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_post",
        title: ensuredTitle,
        body: input.body,
        disciplina: input.disciplina,
        tags: input.tags,
        participantUserIds: input.participantUserIds || [],
        hasAttachments: false,
      }),
    });
    const data = (await response.json()) as CreatePostResponse;
    if (!response.ok || !data.ok || !data.postId) {
      throw new Error(data?.error?.message || "Não foi possível publicar.");
    }
    return { postId: data.postId };
  }

  const linked: Array<{
    materialId: string;
    fileName: string;
    fileMime: string;
    sortOrder: number;
  }> = [];
  const uploadedMaterialIds: string[] = [];

  try {
    for (let index = 0; index < input.files.length; index += 1) {
      const file = input.files[index];
      const isImage =
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file.name);
      const isPdf = file.type.includes("pdf") || /\.pdf$/i.test(file.name);
      const isPpt =
        file.type.includes("presentation") ||
        file.type.includes("powerpoint") ||
        /\.pptx?$/i.test(file.name);
      const tipoMaterial = isImage
        ? "Imagem"
        : isPdf
          ? "PDF"
          : isPpt
            ? "Apresentação"
            : "Documento";

      const form = new FormData();
      form.set("title", (file.name || ensuredTitle).slice(0, 120));
      form.set(
        "description",
        (input.body || ensuredTitle || "Anexo da publicação na comunidade").slice(0, 2000),
      );
      form.set("etapa", "Ensino Fundamental");
      form.set("anoSerie", "Geral");
      form.set("componente", input.disciplina);
      form.set("tipoMaterial", tipoMaterial);
      form.set("tema", ensuredTitle);
      form.set("tags", [...input.tags, "discussao-anexo", isImage ? "imagem" : "arquivo"].join(", "));
      form.set("authorName", viewerName);
      form.set("isPublished", "true");
      form.set("file", file);

      const uploadResponse = await fetch("/api/marketplace/materiais", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const uploadData = (await uploadResponse.json().catch(() => ({}))) as UploadMaterialResponse;

      if (!uploadResponse.ok || !uploadData.item?.id) {
        throw new Error(
          uploadData?.error?.message || "Não foi possível anexar o material.",
        );
      }

      uploadedMaterialIds.push(uploadData.item.id);
      linked.push({
        materialId: uploadData.item.id,
        fileName: file.name,
        fileMime: file.type || "application/octet-stream",
        sortOrder: index,
      });
    }

    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_post_with_attachments",
        title: ensuredTitle,
        body: input.body,
        disciplina: input.disciplina,
        tags: input.tags,
        participantUserIds: input.participantUserIds || [],
        attachments: linked,
      }),
    });
    const data = (await response.json()) as CreatePostResponse;

    if (!response.ok || !data.ok || !data.postId) {
      throw new Error(data?.error?.message || "Não foi possível publicar.");
    }

    return { postId: data.postId };
  } catch (error) {
    await deleteUploadedMaterials(uploadedMaterialIds);
    throw error instanceof Error ? error : new Error("create_post_attachments_failed");
  }
}
