import { getSupabaseAdminClient } from "../supabase/admin-client";
import type {
  MaterialGenerationCreditInfo,
  PlanifyGeneratedMaterial,
} from "../../types/material-generator";

export type MaterialCreditReservation = {
  credit: MaterialGenerationCreditInfo;
  duplicateMaterial?: PlanifyGeneratedMaterial | null;
  duplicateId?: string | null;
};

function isUuid(value: string | null | undefined): boolean {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function tableMissingMessage(errorMessage: string): boolean {
  return /does not exist|schema cache|generated_materials|credit_wallets|credit_ledger|function/i.test(
    errorMessage,
  );
}

async function findDuplicateMaterial(params: {
  userId: string;
  requestHash: string;
  idempotencyKey: string;
}): Promise<{ id: string; material: PlanifyGeneratedMaterial } | null> {
  const supabase = getSupabaseAdminClient();

  const byIdempotency = await (supabase as any)
    .from("generated_materials")
    .select("id,response_json")
    .eq("user_id", params.userId)
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();

  if (byIdempotency.error) {
    throw new Error(byIdempotency.error.message);
  }

  if (byIdempotency.data?.response_json) {
    return {
      id: String(byIdempotency.data.id),
      material: byIdempotency.data.response_json as PlanifyGeneratedMaterial,
    };
  }

  const byHash = await (supabase as any)
    .from("generated_materials")
    .select("id,response_json")
    .eq("user_id", params.userId)
    .eq("request_hash", params.requestHash)
    .maybeSingle();

  if (byHash.error) {
    throw new Error(byHash.error.message);
  }

  if (byHash.data?.response_json) {
    return {
      id: String(byHash.data.id),
      material: byHash.data.response_json as PlanifyGeneratedMaterial,
    };
  }

  return null;
}

export async function reserveMaterialCredits(params: {
  userId: string | null;
  isAdminBypass: boolean;
  cost: number;
  requestHash: string;
  idempotencyKey: string;
}): Promise<MaterialCreditReservation> {
  if (params.isAdminBypass || !isUuid(params.userId)) {
    return {
      credit: {
        cost: params.cost,
        mode: "bypass",
        message: "Consumo de créditos ignorado para conta administradora/teste.",
        balanceAfter: null,
      },
    };
  }

  try {
    const duplicate = await findDuplicateMaterial({
      userId: params.userId as string,
      requestHash: params.requestHash,
      idempotencyKey: params.idempotencyKey,
    });

    if (duplicate) {
      return {
        duplicateMaterial: duplicate.material,
        duplicateId: duplicate.id,
        credit: {
          cost: 0,
          mode: "duplicate",
          message: "Requisição duplicada detectada. O Planify devolveu o material já gerado sem consumir novos créditos.",
          balanceAfter: null,
        },
      };
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase as any).rpc(
      "planify_reserve_material_credits",
      {
        p_user_id: params.userId,
        p_amount: params.cost,
        p_reason: "material_generation",
        p_request_hash: params.requestHash,
        p_idempotency_key: params.idempotencyKey,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    const result = data as {
      ok?: boolean;
      balance_after?: number;
      message?: string;
      error?: string;
    };

    if (!result?.ok) {
      throw new Error(result?.message || result?.error || "Créditos insuficientes.");
    }

    return {
      credit: {
        cost: params.cost,
        mode: "reserved",
        message: result.message || "Créditos reservados com sucesso.",
        balanceAfter: result.balance_after ?? null,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao reservar créditos.";

    if (tableMissingMessage(message)) {
      return {
        credit: {
          cost: params.cost,
          mode: "not_configured",
          message:
            "A estrutura de créditos ainda não foi aplicada no Supabase. Execute o SQL 10-0 antes de liberar para usuários comuns.",
          balanceAfter: null,
        },
      };
    }

    throw error;
  }
}

export async function commitMaterialCredits(params: {
  userId: string | null;
  isAdminBypass: boolean;
  cost: number;
  requestHash: string;
  idempotencyKey: string;
  creditMode: MaterialGenerationCreditInfo["mode"];
}): Promise<void> {
  if (
    params.isAdminBypass ||
    !isUuid(params.userId) ||
    params.creditMode !== "reserved"
  ) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await (supabase as any).rpc("planify_commit_material_credits", {
    p_user_id: params.userId,
    p_amount: params.cost,
    p_reason: "material_generation_completed",
    p_request_hash: params.requestHash,
    p_idempotency_key: params.idempotencyKey,
  });
}

export async function refundMaterialCredits(params: {
  userId: string | null;
  isAdminBypass: boolean;
  cost: number;
  requestHash: string;
  idempotencyKey: string;
  creditMode: MaterialGenerationCreditInfo["mode"];
}): Promise<void> {
  if (
    params.isAdminBypass ||
    !isUuid(params.userId) ||
    params.creditMode !== "reserved"
  ) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await (supabase as any).rpc("planify_refund_material_credits", {
    p_user_id: params.userId,
    p_amount: params.cost,
    p_reason: "material_generation_failed",
    p_request_hash: params.requestHash,
    p_idempotency_key: params.idempotencyKey,
  });
}

export async function saveGeneratedMaterialRecord(params: {
  userId: string | null;
  title: string;
  materialType: string;
  requestPayload: unknown;
  responseJson: PlanifyGeneratedMaterial;
  htmlEditor: string;
  model: string;
  creditCost: number;
  requestHash: string;
  idempotencyKey: string;
}): Promise<string | null> {
  if (!isUuid(params.userId)) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("generated_materials")
    .insert({
      user_id: params.userId,
      title: params.title,
      material_type: params.materialType,
      request_payload: params.requestPayload,
      response_json: params.responseJson,
      html_editor: params.htmlEditor,
      model: params.model,
      credit_cost: params.creditCost,
      request_hash: params.requestHash,
      idempotency_key: params.idempotencyKey,
      status: "completed",
    })
    .select("id")
    .single();

  if (error) {
    if (tableMissingMessage(error.message)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data?.id ? String(data.id) : null;
}
