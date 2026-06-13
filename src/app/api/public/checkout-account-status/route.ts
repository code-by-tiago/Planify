import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findAuthUserByEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  let page = 1;

  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(error.message);

    const user = data.users.find(
      (item) => String(item.email || "").trim().toLowerCase() === email,
    );

    if (user) {
      return {
        exists: true,
        emailConfirmed: Boolean(user.email_confirmed_at),
      };
    }

    if (data.users.length < 100) break;
    page += 1;
  }

  return { exists: false, emailConfirmed: false };
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { success: false, error: { message: "E-mail inválido." } },
      { status: 400 },
    );
  }

  try {
    const auth = await findAuthUserByEmail(email);
    const supabase = getSupabaseAdminClient();

    const { data: subscription } = await (supabase as any)
      .from("subscriptions")
      .select("id,status")
      .eq("stripe_customer_email", email)
      .in("status", ["active", "trialing"])
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        hasAccount: auth.exists,
        emailConfirmed: auth.emailConfirmed,
        hasActiveSubscription: Boolean(subscription),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível verificar a conta.",
        },
      },
      { status: 500 },
    );
  }
}
