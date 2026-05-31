import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../server/auth/admin-access";
import { getSupabaseAdminClient } from "../../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function jsonError(message: string, status = 400, code = "error") {
  return NextResponse.json(
    {
      success: false,
      error: { message, code },
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
      .slice(0, 120) || "material-planify"
  );
}

function guessAreaByComponent(component: string) {
  const value = component.toLowerCase();

  if (value.includes("matem")) return "Matemática";
  if (value.includes("ciên") || value.includes("cien") || value.includes("biologia") || value.includes("física") || value.includes("fisica") || value.includes("química") || value.includes("quimica")) return "Ciências da Natureza";
  if (value.includes("hist") || value.includes("geo") || value.includes("filos") || value.includes("socio")) return "Ciências Humanas";
  if (value.includes("arte") || value.includes("portugu") || value.includes("ingl") || value.includes("educação física") || value.includes("educacao fisica")) return "Linguagens";

  return "Multicomponente";
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
    anoSerie: row.ano_serie || "",
    categoria: row.categoria || "Material",
    tipoMaterial: row.tipo_material || row.categoria || "Material",
    componente: row.componente || "Multicomponente",
    tema: row.tema || "",
    finalidade: row.finalidade || "",
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

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi(request);

  if (!admin.ok) {
    return admin.response;
  }

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("library_materials") as any;

  const { data, error } = await table
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(`Erro ao listar materiais: ${error.message}`, 500, "list_error");
  }

  const items = await Promise.all(
    ((data || []) as LibraryMaterialRow[]).map((row) => withSignedUrl(row)),
  );

  return NextResponse.json({
    success: true,
    items,
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminApi(request);

  if (!admin.ok) {
    return admin.response;
  }

  const formData = await request.formData();

  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const etapa = normalizeText(formData.get("etapa"), "Ensino Fundamental");
  const anoSerie = normalizeText(formData.get("anoSerie"), "Geral");
  const componente = normalizeText(formData.get("componente"), "Multicomponente");
  const tipoMaterial = normalizeText(formData.get("tipoMaterial"), "Material de apoio");
  const tema = normalizeText(formData.get("tema"), title);
  const tags = parseList(normalizeText(formData.get("tags")));
  const habilidadesBncc = parseList(normalizeText(formData.get("habilidadesBncc")));
  const isPublished = normalizeText(formData.get("isPublished"), "true") !== "false";
  const fileValue = formData.get("file");

  const areaConhecimento = normalizeText(
    formData.get("areaConhecimento"),
    guessAreaByComponent(componente),
  );
  const categoria = normalizeText(formData.get("categoria"), tipoMaterial);
  const finalidade = normalizeText(formData.get("finalidade"), "Apoio pedagógico");
  const nivelDificuldade = normalizeText(formData.get("nivelDificuldade"), "Geral");
  const duracao = normalizeText(formData.get("duracao"), "");
  const observacoes = normalizeText(formData.get("observacoes"), "");

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
  const fileId = randomUUID();
  const originalName = safeFilename(fileValue.name || "material");
  const extension = originalName.includes(".")
    ? originalName.split(".").pop()
    : "bin";
  const storagePath = `${fileId}/${safeFilename(title)}.${extension}`;
  const arrayBuffer = await fileValue.arrayBuffer();
  const uploadBody = new Uint8Array(arrayBuffer);

  const uploadResult = await (supabase.storage.from(BUCKET_NAME) as any).upload(
    storagePath,
    uploadBody,
    {
      contentType: fileValue.type || "application/octet-stream",
      upsert: false,
    },
  );

  if (uploadResult.error) {
    return jsonError(`Erro ao enviar arquivo: ${uploadResult.error.message}`, 500, "upload_error");
  }

  const row = {
    id: fileId,
    title,
    description,
    etapa,
    area_conhecimento: areaConhecimento,
    ano_serie: anoSerie,
    categoria,
    tipo_material: tipoMaterial,
    componente,
    tema,
    finalidade,
    nivel_dificuldade: nivelDificuldade,
    duracao,
    habilidades_bncc: habilidadesBncc,
    observacoes,
    tags,
    file_name: fileValue.name || originalName,
    file_path: storagePath,
    file_mime: fileValue.type || "application/octet-stream",
    file_size: fileValue.size,
    is_published: isPublished,
    created_by: admin.admin.userId,
    updated_at: new Date().toISOString(),
  };

  const table = supabase.from("library_materials") as any;
  const { data, error } = await table.insert(row).select("*").single();

  if (error) {
    await (supabase.storage.from(BUCKET_NAME) as any).remove([storagePath]);

    return jsonError(
      `Erro ao salvar material: ${error.message}. Confirme se a tabela library_materials e o bucket biblioteca-materiais existem no Supabase.`,
      500,
      "database_error",
    );
  }

  return NextResponse.json({
    success: true,
    item: await withSignedUrl(data as LibraryMaterialRow),
  });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminApi(request);

  if (!admin.ok) {
    return admin.response;
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return jsonError("ID do material não informado.");
  }

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("library_materials") as any;

  const { data: material, error: readError } = await table
    .select("id,file_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return jsonError(`Erro ao localizar material: ${readError.message}`, 500, "read_error");
  }

  if (!material) {
    return jsonError("Material não encontrado.", 404, "not_found");
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
