import { sendSupportContactEmail } from "@/server/email/resend-email-service";

export type ContactSupportPayload = {
  nome: string;
  email: string;
  perfil: string;
  tipo: string;
  assunto: string;
  mensagem: string;
  pageUrl?: string;
  userAgent?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number, multiline = false): string {
  const normalized = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength);

  if (multiline) {
    return normalized;
  }

  return normalized.replace(/\n+/g, " ");
}

export function normalizeContactPayload(input: unknown): ContactSupportPayload {
  const body = (input || {}) as Partial<ContactSupportPayload>;

  return {
    nome: clean(body.nome, 120),
    email: clean(body.email, 160).toLowerCase(),
    perfil: clean(body.perfil, 80) || "Não informado",
    tipo: clean(body.tipo, 80) || "suporte",
    assunto: clean(body.assunto, 180),
    mensagem: clean(body.mensagem, 5000, true),
    pageUrl: clean(body.pageUrl, 500),
    userAgent: clean(body.userAgent, 300),
  };
}

export function validateContactPayload(payload: ContactSupportPayload): string | null {
  if (!payload.nome) return "Informe seu nome.";
  if (!EMAIL_PATTERN.test(payload.email)) return "Informe um e-mail válido.";
  if (!payload.assunto) return "Informe o assunto da solicitação.";
  if (payload.mensagem.length < 20) {
    return "Escreva uma mensagem com pelo menos 20 caracteres.";
  }
  return null;
}

export async function sendContactSupportEmail(
  payload: ContactSupportPayload,
): Promise<void> {
  await sendSupportContactEmail(payload);
}
