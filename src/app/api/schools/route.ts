import { NextRequest, NextResponse } from "next/server";
import type { Json } from "@/types/database";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  createSchool,
  listSchoolsForUser,
} from "@/server/schools/school-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  try {
    const schools = await listSchoolsForUser(userId);
    return NextResponse.json({ success: true, schools });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar escolas.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        slug?: string | null;
        city?: string | null;
        state?: string | null;
        metadata?: Record<string, unknown>;
      }
    | null;

  if (!body?.name?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o nome da escola." } },
      { status: 400 },
    );
  }

  try {
    const school = await createSchool(userId, {
      name: body.name,
      slug: body.slug,
      city: body.city,
      state: body.state,
      metadata: (body.metadata || {}) as Json,
    });

    return NextResponse.json({ success: true, school }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar escola.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
