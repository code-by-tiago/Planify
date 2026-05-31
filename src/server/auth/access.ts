export type LegacyAccessResult = {
  authenticated: boolean;
  premium: boolean;
  reason: string;
  message: string;
};

/**
 * Compatibilidade para código antigo.
 *
 * O controle real de acesso premium do Planify agora é feito por:
 * - middleware.ts
 * - src/middleware.ts
 * - /api/auth/access-cookie
 *
 * Esta função não deve mais redirecionar server-side, para evitar loop
 * entre /dashboard e /login.
 */
export async function requirePremiumAccess(): Promise<LegacyAccessResult> {
  return {
    authenticated: true,
    premium: true,
    reason: "middleware_controlled",
    message: "Acesso controlado pelo middleware premium.",
  };
}
