import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [type, token] = authorization.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  const access = await verifyPremiumAccess(token);

  if (!access.authenticated) {
    return NextResponse.json(
      {
        success: false,
        access,
        message: "Usuário não autenticado.",
      },
      { status: 401 },
    );
  }

  if (!access.user?.isAdmin) {
    return NextResponse.json(
      {
        success: false,
        access,
        message: "Usuário autenticado, mas não é administrador.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      access,
      message: "Administrador validado.",
    },
    { status: 200 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "API de validação admin ativa. Use POST com Authorization Bearer.",
    },
    { status: 200 },
  );
}
