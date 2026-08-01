import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "@/server/auth/owner-access";
import {
  createExternalFeaturedMaterial,
  listAdminFeaturedMaterials,
  setMaterialFeatured,
  type FeaturedSource,
} from "@/server/community/community-featured-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const onlyFeatured = request.nextUrl.searchParams.get("featured") === "1";

  try {
    const materials = await listAdminFeaturedMaterials({ onlyFeatured, limit: 80 });
    return NextResponse.json({ ok: true, materials });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar conteúdos.",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const adminUserId = gate.owner.userId;
  if (!adminUserId) return jsonError("Conta admin não identificada.", 401);

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "").trim();

  try {
    if (action === "feature" || action === "unfeature") {
      const materialId = String(body.materialId || "").trim();
      if (!materialId) return jsonError("Material não informado.");
      await setMaterialFeatured({
        materialId,
        featured: action === "feature",
        featuredSource: (String(body.featuredSource || "admin") as FeaturedSource) || "admin",
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "import_external") {
      const material = await createExternalFeaturedMaterial({
        adminUserId,
        adminEmail: gate.owner.email,
        title: String(body.title || ""),
        description: body.description ? String(body.description) : undefined,
        tipoMaterial: body.tipoMaterial ? String(body.tipoMaterial) : undefined,
        componente: body.componente ? String(body.componente) : undefined,
        externalUrl: String(body.externalUrl || ""),
        authorName: body.authorName ? String(body.authorName) : undefined,
      });
      return NextResponse.json({ ok: true, material });
    }

    return jsonError("Ação inválida.");
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível salvar o conteúdo.",
      500,
    );
  }
}
