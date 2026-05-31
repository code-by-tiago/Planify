import { NextRequest, NextResponse } from "next/server";

/**
 * Compatibilidade para código antigo.
 *
 * O Planify agora usa o middleware principal em:
 * - /middleware.ts
 * - /src/middleware.ts
 *
 * Este arquivo antigo não deve mais redirecionar para /login?redirectTo=...
 * Ele fica neutro para evitar conflito de autenticação.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({
    request,
  });
}
