export const protectedRoutes = [
  "/dashboard",
  "/planejamentos",
  "/materiais",
  "/editor",
  "/historico",
  "/biblioteca",
  "/marketplace",
  "/admin",
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

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}
