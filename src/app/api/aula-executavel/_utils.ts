import { NextResponse } from "next/server";

export function jsonLessonExecutionError(error: unknown) {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status?: unknown }).status)
      : 500;
  const message =
    error instanceof Error
      ? error.message
      : "Nao foi possivel processar a aula executavel.";

  return NextResponse.json(
    {
      success: false,
      error: { message },
    },
    { status: Number.isFinite(status) && status >= 400 ? status : 500 },
  );
}
