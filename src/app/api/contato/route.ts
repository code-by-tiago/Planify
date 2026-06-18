import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set([
  "suporte",
  "assinatura",
  "erro",
  "sugestao",
  "parceria",
  "pedagogico",
]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const nome = String(body.nome || "").trim();
  const email = String(body.email || "").trim();
  const perfil = String(body.perfil || "Professor").trim();
  const tipo = String(body.tipo || "suporte").trim();
  const assunto = String(body.assunto || "").trim();
  const mensagem = String(body.mensagem || "").trim();

  if (!nome) return jsonError("Informe seu nome.");
  if (!email || !email.includes("@")) return jsonError("Informe um e-mail válido.");
  if (!VALID_TYPES.has(tipo)) return jsonError("Tipo de solicitação inválido.");
  if (!assunto) return jsonError("Informe o assunto da solicitação.");
  if (mensagem.length < 20) {
    return jsonError("Escreva uma mensagem com pelo menos 20 caracteres.");
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("operational_events").insert({
      event_type: "contact_submission",
      tool_tipo: "contato",
      ok: true,
      metadata: {
        nome,
        email,
        perfil,
        tipo,
        assunto,
        mensagem,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    if (error) {
      console.error("[contato] falha ao registrar solicitação:", error.message);
      return jsonError(
        "Não foi possível registrar sua mensagem agora. Tente novamente em instantes ou escreva para o e-mail de suporte.",
        503,
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Solicitação recebida. Nossa equipe analisa e responde pelo e-mail informado em até 2 dias úteis.",
    });
  } catch (err) {
    console.error("[contato] erro inesperado:", err);
    return jsonError(
      "Serviço de contato temporariamente indisponível. Tente novamente mais tarde.",
      503,
    );
  }
}
