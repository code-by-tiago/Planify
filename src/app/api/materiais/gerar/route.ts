import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMaterialCreditCost } from "../../../../config/material-credits";
import {
  generateMaterial,
  getMaterialRequestHash,
  normalizeMaterialRequest,
  validateMaterialRequest,
} from "../../../../server/materials/material-generator-service";
import {
  commitMaterialCredits,
  refundMaterialCredits,
  reserveMaterialCredits,
  saveGeneratedMaterialRecord,
} from "../../../../server/materials/material-credit-service";
import { resolveAdminAccess } from "../../../../server/auth/admin-access";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";
import type {
  MaterialGenerationErrorResponse,
  MaterialGenerationResponse,
} from "../../../../types/material-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const GEMINI_MODEL = "gemini-2.5-flash";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    } satisfies MaterialGenerationErrorResponse,
    { status },
  );
}

async function resolveApiAccess(request: NextRequest) {
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;

  const access = await verifyPremiumAccess(premiumToken);
  const adminFromAdminCookie = await resolveAdminAccess(adminToken);
  const admin = adminFromAdminCookie.isAdmin
    ? adminFromAdminCookie
    : await resolveAdminAccess(premiumToken);

  const authenticated = Boolean(access.authenticated || admin.authenticated);
  const isAdminBypass = Boolean(admin.isAdmin);
  const premium = Boolean(access.premium || isAdminBypass);
  const userId = access.user?.id || admin.userId || null;
  const email = access.user?.email || admin.email || null;

  return {
    authenticated,
    premium,
    isAdminBypass,
    userId,
    email,
  };
}

export async function POST(request: NextRequest) {
  let reservedCreditMode: "reserved" | "bypass" | "duplicate" | "not_configured" = "bypass";
  let userId: string | null = null;
  let isAdminBypass = false;
  let creditCost = 0;
  let requestHash = "";
  let idempotencyKey = "";

  try {
    const access = await resolveApiAccess(request);
    userId = access.userId;
    isAdminBypass = access.isAdminBypass;

    if (!access.authenticated) {
      return errorResponse(
        "not_authenticated",
        "Faça login para gerar materiais didáticos.",
        401,
      );
    }

    if (!access.premium) {
      return errorResponse(
        "premium_required",
        "Seu plano precisa estar ativo para usar o Gerador IA de Materiais.",
        403,
      );
    }

    const body = await request.json();
    const input = normalizeMaterialRequest(body);
    const validationErrors = validateMaterialRequest(input);

    if (validationErrors.length > 0) {
      return errorResponse(
        "invalid_request",
        validationErrors.join(" "),
        400,
      );
    }

    creditCost = getMaterialCreditCost(input.tipoMaterial, input.tamanho);
    requestHash = getMaterialRequestHash(input);
    idempotencyKey = input.idempotencyKey || crypto.randomUUID();

    const reservation = await reserveMaterialCredits({
      userId,
      isAdminBypass,
      cost: creditCost,
      requestHash,
      idempotencyKey,
    });

    reservedCreditMode = reservation.credit.mode;

    if (reservation.duplicateMaterial) {
      return NextResponse.json(
        {
          success: true,
          data: {
            material: reservation.duplicateMaterial,
            credit: reservation.credit,
            requestHash,
            idempotencyKey,
            duplicate: true,
          },
        } satisfies MaterialGenerationResponse,
        { status: 200 },
      );
    }

    if (reservedCreditMode === "not_configured" && !isAdminBypass) {
      return errorResponse(
        "credits_not_configured",
        reservation.credit.message,
        503,
      );
    }

    const generated = await generateMaterial({
      ...input,
      idempotencyKey,
    });

    await saveGeneratedMaterialRecord({
      userId,
      title: generated.material.titulo,
      materialType: input.tipoMaterial,
      requestPayload: input,
      responseJson: generated.material,
      htmlEditor: generated.material.htmlEditor,
      model: process.env.GEMINI_MODEL || GEMINI_MODEL,
      creditCost,
      requestHash,
      idempotencyKey,
    });

    await commitMaterialCredits({
      userId,
      isAdminBypass,
      cost: creditCost,
      requestHash,
      idempotencyKey,
      creditMode: reservedCreditMode,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          material: generated.material,
          credit: reservation.credit,
          requestHash,
          idempotencyKey,
          duplicate: false,
        },
      } satisfies MaterialGenerationResponse,
      { status: 200 },
    );
  } catch (error) {
    await refundMaterialCredits({
      userId,
      isAdminBypass,
      cost: creditCost,
      requestHash,
      idempotencyKey,
      creditMode: reservedCreditMode,
    }).catch(() => undefined);

    const message = error instanceof Error ? error.message : "Erro inesperado.";

    if (message.includes("GEMINI_API_KEY")) {
      return errorResponse(
        "missing_api_key",
        "A variável GEMINI_API_KEY não está configurada no servidor.",
        500,
        message,
      );
    }

    if (message.toLowerCase().includes("créditos insuficientes")) {
      return errorResponse(
        "insufficient_credits",
        "Saldo de créditos insuficiente para gerar este material.",
        402,
        message,
      );
    }

    return errorResponse(
      "material_generation_failed",
      "Não foi possível gerar o material didático agora.",
      502,
      message,
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Gerador IA de Materiais ativo. Use POST para gerar.",
      endpoint: "/api/materiais/gerar",
      model: process.env.GEMINI_MODEL || GEMINI_MODEL,
    },
    { status: 200 },
  );
}
