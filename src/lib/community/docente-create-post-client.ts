import type { DocenteCreatePostInput } from "@/lib/community/docente-types";

type CreatePostResponse = {
  ok?: boolean;
  postId?: string;
  error?: { message?: string };
};

type UploadMaterialResponse = {
  success?: boolean;
  item?: { id?: string };
  error?: { message?: string };
};

async function deletePost(postId: string): Promise<void> {
  await fetch("/api/community/docente/actions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete_post", postId }),
  }).catch(() => undefined);
}

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
  groupId?: string | null;
}): Promise<{ postId: string }> {
  const { input, viewerName, groupId } = params;

  const response = await fetch("/api/community/docente/actions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_post",
      title: input.title,
      body: input.body,
      disciplina: input.disciplina,
      tags: input.tags,
      participantUserIds: input.participantUserIds || [],
      groupId: groupId || undefined,
    }),
  });
  const data = (await response.json()) as CreatePostResponse;

  if (!response.ok || !data.ok || !data.postId) {
    throw new Error(data?.error?.message || "Não foi possível publicar.");
  }

  const postId = data.postId;

  if (input.files.length === 0) {
    return { postId };
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
      const form = new FormData();
      form.set("title", `${input.title} — ${file.name}`.slice(0, 120));
      form.set("description", input.body || input.title);
      form.set("etapa", "Ensino Fundamental");
      form.set("anoSerie", "Geral");
      form.set("componente", input.disciplina);
      form.set("tipoMaterial", "Material de apoio");
      form.set("tema", input.title);
      form.set("tags", [...input.tags, "discussao-anexo"].join(", "));
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

    const linkResponse = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "link_post_attachments",
        postId,
        attachments: linked,
      }),
    });
    const linkData = (await linkResponse.json()) as CreatePostResponse & { linked?: number };

    if (!linkResponse.ok || !linkData.ok) {
      throw new Error(linkData?.error?.message || "Não foi possível vincular os anexos.");
    }

    return { postId };
  } catch (error) {
    await deleteUploadedMaterials(uploadedMaterialIds);
    await deletePost(postId);
    throw error instanceof Error ? error : new Error("create_post_attachments_failed");
  }
}
