import { NextRequest, NextResponse } from "next/server";
import { isOwnerEmail } from "../../../../server/auth/owner-emails";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE_NAME = "planify_admin_access";

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
        "Não foi possível validar a sessão do Supabase.",
        401,
        "invalid_token",
      );
    }

    const email = data.user.email.trim().toLowerCase();
    const isOwnerAccount = isOwnerEmail(email);

    if (!isOwnerAccount) {
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
      isAdmin: true,
      email,
    });

    // Segurança 9.15.13:
    // Cookie admin é de sessão do navegador. Sem maxAge.
    // Além disso, o front exige uma chave em sessionStorage.
    // Ao fechar a aba, a chave some e o Admin pede login novamente.
    response.cookies.set(ADMIN_COOKIE_NAME, accessToken, {
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
        : "Não foi possível criar sessão administrativa.",
      500,
      "admin_session_error",
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
