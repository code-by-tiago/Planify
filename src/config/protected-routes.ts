export const protectedRoutes = [
  "/dashboard",
  "/planejamentos",
  "/materiais",
  "/inclusao",
  "/editor",
  "/historico",
  "/biblioteca",
  "/marketplace",
  "/admin",
];

/** Authenticated routes that allow free tier (paywall handled in-page) */
export const authOnlyRoutes = [
  "/progresso-bncc",
  "/bncc",
  "/diretor",
  "/gestor",
];

export const adminRoutes = ["/admin"];

export const publicRoutes = [
  "/",
  "/login",
  "/planos",
  "/contato",
  "/acesso-negado",
  "/api",
];

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}
