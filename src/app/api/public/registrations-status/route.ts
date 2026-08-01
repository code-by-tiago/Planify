import { NextResponse } from "next/server";
import { areRegistrationsEnabled } from "../../../../server/admin/platform-settings-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const enabled = await areRegistrationsEnabled();

    return NextResponse.json(
      { success: true, registrationsEnabled: enabled },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { success: true, registrationsEnabled: true },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  }
}
