import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER_COOKIE_NAME = "planify_owner_access";

function ownerEmails() {
  return [
    process.env.PLANIFY_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    "ts162351@gmail.com",
  ]
    .join(",")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function jsonError(message: string, status = 400, code = "error") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    const accessToken = String(body.accessToken || "").trim();

    if (!accessToken) {
      return jsonError("Token de acesso não informado.", 400, "missing_token");
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user?.email) {
      return jsonError(
        "Não foi possível validar a sessão do proprietário.",
        401,
        "invalid_token",
      );
    }

    const email = data.user.email.trim().toLowerCase();

    if (!ownerEmails().includes(email)) {
      return jsonError(
        "Esta conta não é o proprietário do Planify.",
        403,
        "not_owner",
      );
    }

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      isOwner: true,
      premium: true,
      email,
    });

    response.cookies.set(OWNER_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Não foi possível criar sessão do proprietário.",
      500,
      "owner_session_error",
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(OWNER_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
