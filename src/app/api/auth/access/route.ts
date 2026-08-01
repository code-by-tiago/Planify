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

  return NextResponse.json(
    {
      success: access.premium,
      access,
    },
    { status: access.authenticated ? 200 : 401 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "API de validação premium ativa. Use POST com Authorization Bearer.",
    },
    { status: 200 },
  );
}
