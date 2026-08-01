import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  verifyPremiumAccess,
  type PremiumAccessResult,
} from "./premium-access-service";

const SESSION_COOKIE = "planify_session";
const PREMIUM_COOKIE = "planify_access";
const ADMIN_COOKIE = "planify_admin_access";
const OWNER_COOKIE = "planify_owner_access";

export function looksLikeJwt(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function getRequestAccessToken(request: NextRequest): string | null {
  const bearer = request.headers.get("authorization") || "";
  const match = bearer.match(/^Bearer\s+(.+)$/i);
  const fromHeader = match?.[1]?.trim() || null;

  if (fromHeader && looksLikeJwt(fromHeader)) {
    return fromHeader;
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value || null;
  if (session && looksLikeJwt(session)) {
    return session;
  }

  const owner = request.cookies.get(OWNER_COOKIE)?.value || null;
  if (owner && looksLikeJwt(owner)) {
    return owner;
  }

  const admin = request.cookies.get(ADMIN_COOKIE)?.value || null;
  if (admin && looksLikeJwt(admin)) {
    return admin;
  }

  const premium = request.cookies.get(PREMIUM_COOKIE)?.value || null;
  if (premium && looksLikeJwt(premium)) {
    return premium;
  }

  return null;
}

export function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = JSON.parse(atob(padded)) as { exp?: number };

    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export function isJwtNotExpired(token: string): boolean {
  const exp = decodeJwtExpiry(token);
  if (!exp) return false;
  return exp * 1000 > Date.now();
}

export async function requireApiPremiumAccess(
  request: NextRequest,
): Promise<
  | { ok: true; access: PremiumAccessResult; token: string }
  | { ok: false; response: NextResponse }
> {
  const token = getRequestAccessToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: { message: "Autenticação necessária. Faça login para continuar." },
        },
        { status: 401 },
      ),
    };
  }

  const access = await verifyPremiumAccess(token);

  if (!access.authenticated) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: { message: access.message || "Sessão inválida ou expirada." },
        },
        { status: 401 },
      ),
    };
  }

  if (!access.premium) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            message:
              access.message ||
              "Plano ativo necessário para usar esta funcionalidade.",
          },
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, access, token };
}

export async function requireApiAuthenticated(
  request: NextRequest,
): Promise<
  | { ok: true; access: PremiumAccessResult; token: string }
  | { ok: false; response: NextResponse }
> {
  const token = getRequestAccessToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: { message: "Autenticação necessária." },
        },
        { status: 401 },
      ),
    };
  }

  const access = await verifyPremiumAccess(token);

  if (!access.authenticated || !access.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: { message: access.message || "Sessão inválida." },
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true, access, token };
}
