import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const BUCKET_NAME = "marketplace-materiais";

type MarketplaceMaterialRow = {
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
  is_saved_snapshot?: boolean | null;
  source_material_id?: string | null;
};

type SavedMaterialRow = {
  material_id: string;
  source_material_id: string | null;
};

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

function isMissingColumnError(message: string): boolean {
  return /column.*does not exist|schema cache/i.test(message);
}

function safeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 120) || "material-salvo"
  );
}

function resolveSavedSourceId(row: SavedMaterialRow): string {
  return String(row.source_material_id || row.material_id);
}

async function copyMarketplaceStorageFile(params: {
  sourcePath: string;
  targetPath: string;
  contentType?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const bucket = supabase.storage.from(BUCKET_NAME) as {
    download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
    upload: (
      path: string,
      body: Uint8Array,
      options: { contentType: string; upsert: boolean },
    ) => Promise<{ error: { message: string } | null }>;
  };

  const { data: fileData, error: downloadError } = await bucket.download(params.sourcePath);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message || "Não foi possível copiar o arquivo do material.");
  }

  const buffer = new Uint8Array(await fileData.arrayBuffer());
  const uploadResult = await bucket.upload(params.targetPath, buffer, {
    contentType: params.contentType || "application/octet-stream",
    upsert: false,
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message || "Não foi possível salvar cópia do material.");
  }
}

async function listSavedRows(userId: string): Promise<SavedMaterialRow[]> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_saved_materials")
    .select("material_id, source_material_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    return [];
  }

  return (data || []) as SavedMaterialRow[];
}

async function findSavedRow(params: {
  userId: string;
  materialId: string;
}): Promise<SavedMaterialRow | null> {
  const rows = await listSavedRows(params.userId);

  return (
    rows.find(
      (row) =>
        row.material_id === params.materialId ||
        resolveSavedSourceId(row) === params.materialId,
    ) || null
  );
}

async function deleteSnapshotMaterial(snapshotId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: snapshot } = await (supabase as any)
    .from("marketplace_materials")
    .select("id, file_path, is_saved_snapshot")
    .eq("id", snapshotId)
    .maybeSingle();

  if (!snapshot?.is_saved_snapshot) {
    return;
  }

  if (snapshot.file_path) {
    await (supabase.storage.from(BUCKET_NAME) as { remove: (paths: string[]) => Promise<unknown> }).remove([
      snapshot.file_path,
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("marketplace_materials").delete().eq("id", snapshotId);
}

export async function getSavedMaterialIds(params: {
  userId: string;
  materialIds?: string[];
}): Promise<Set<string>> {
  const rows = await listSavedRows(params.userId);
  const savedSourceIds = new Set(rows.map((row) => resolveSavedSourceId(row)));

  if (!params.materialIds?.length) {
    return savedSourceIds;
  }

  const wanted = new Set(params.materialIds.map(String));
  const matched = new Set<string>();

  for (const id of savedSourceIds) {
    if (wanted.has(id)) {
      matched.add(id);
    }
  }

  return matched;
}

export async function saveCommunityMaterial(params: {
  userId: string;
  materialId: string;
}): Promise<{ saved: boolean; snapshotMaterialId: string }> {
  const supabase = getSupabaseAdminClient();

  const existing = await findSavedRow({
    userId: params.userId,
    materialId: params.materialId,
  });

  if (existing) {
    return {
      saved: true,
      snapshotMaterialId: existing.material_id,
    };
  }

  const { data: material, error: readError } = await supabase
    .from("marketplace_materials")
    .select("*")
    .eq("id", params.materialId)
    .eq("is_published", true)
    .maybeSingle();

  if (readError || !material) {
    throw new Error("Material não encontrado.");
  }

  const source = material as MarketplaceMaterialRow;

  if (source.is_saved_snapshot) {
    throw new Error("Este material já é uma cópia salva.");
  }

  if (!source.file_path) {
    throw new Error("Material sem arquivo anexado.");
  }

  const snapshotId = randomUUID();
  const originalName = safeFilename(source.file_name || source.title || "material");
  const extension = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const storagePath = `${params.userId}/saved/${snapshotId}/${safeFilename(source.title)}.${extension}`;

  await copyMarketplaceStorageFile({
    sourcePath: source.file_path,
    targetPath: storagePath,
    contentType: source.file_mime,
  });

  const snapshotRow = {
    id: snapshotId,
    user_id: params.userId,
    owner_email: null,
    author_name: source.author_name,
    title: source.title,
    description: source.description || "",
    etapa: source.etapa || "Ensino Fundamental",
    ano_serie: source.ano_serie || "Geral",
    componente: source.componente || "Multicomponente",
    tipo_material: source.tipo_material || "Material de apoio",
    tema: source.tema || source.title,
    tags: source.tags || [],
    file_name: source.file_name,
    file_path: storagePath,
    file_mime: source.file_mime,
    file_size: source.file_size || 0,
    is_published: false,
    is_saved_snapshot: true,
    source_material_id: source.id,
    downloads_count: 0,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertSnapshotError } = await (supabase as any)
    .from("marketplace_materials")
    .insert(snapshotRow);

  if (insertSnapshotError) {
    await (supabase.storage.from(BUCKET_NAME) as { remove: (paths: string[]) => Promise<unknown> }).remove([
      storagePath,
    ]);

    if (isMissingColumnError(insertSnapshotError.message)) {
      throw new Error("Biblioteca da Comunidade em atualização. Tente novamente em instantes.");
    }

    throw new Error(insertSnapshotError.message || "Não foi possível salvar o material.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: saveError } = await (supabase as any).from("community_saved_materials").insert({
    user_id: params.userId,
    material_id: snapshotId,
    source_material_id: source.id,
  });

  if (saveError) {
    await deleteSnapshotMaterial(snapshotId);

    if (isMissingTableError(saveError.message) || isMissingColumnError(saveError.message)) {
      throw new Error("Biblioteca da Comunidade em atualização. Tente novamente em instantes.");
    }

    if (!/duplicate|unique/i.test(saveError.message)) {
      throw new Error(saveError.message || "Não foi possível salvar o material.");
    }
  }

  return { saved: true, snapshotMaterialId: snapshotId };
}

export async function unsaveCommunityMaterial(params: {
  userId: string;
  materialId: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const saved = await findSavedRow({
    userId: params.userId,
    materialId: params.materialId,
  });

  if (!saved) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("community_saved_materials")
    .delete()
    .eq("user_id", params.userId)
    .eq("material_id", saved.material_id);

  if (error && !isMissingTableError(error.message)) {
    throw new Error(error.message || "Não foi possível remover da biblioteca.");
  }

  await deleteSnapshotMaterial(saved.material_id);
}

export async function listSavedMaterialIds(userId: string): Promise<string[]> {
  const rows = await listSavedRows(userId);
  return rows.map((row) => String(row.material_id));
}
