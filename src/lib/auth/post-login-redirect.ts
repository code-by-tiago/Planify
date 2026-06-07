export type PostLoginAccessSnapshot = {
  canViewDirectorPanel?: boolean;
  isManagerView?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
};

/** Accepts only same-origin internal paths; rejects auth loops and admin routes. */
export function sanitizeInternalRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (
    value === "/login" ||
    value === "/sair" ||
    value === "/logout" ||
    value.startsWith("/admin")
  ) {
    return null;
  }

  return value;
}

export function hasGestorHomeAccess(
  access: PostLoginAccessSnapshot,
): boolean {
  if (access.isAdmin || access.isOwner) {
    return false;
  }
  return Boolean(access.canViewDirectorPanel);
}

export function resolveDefaultPostLoginPath(
  access: PostLoginAccessSnapshot,
): string {
  return hasGestorHomeAccess(access) ? "/gestor" : "/dashboard";
}

export function resolvePostLoginRedirect(
  redirectParam: string | null,
  access: PostLoginAccessSnapshot,
): string {
  const safeRedirect = sanitizeInternalRedirect(redirectParam);
  if (safeRedirect) {
    return safeRedirect;
  }

  return resolveDefaultPostLoginPath(access);
}
