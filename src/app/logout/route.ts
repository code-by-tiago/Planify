import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIES_TO_CLEAR = [
  "planify_access",
  "planify_session",
  "planify_admin_access",
  "planify_owner_access",
];

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", appUrl));

  const clearOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  };

  for (const name of COOKIES_TO_CLEAR) {
    response.cookies.set(name, "", clearOptions);
  }

  return response;
}
