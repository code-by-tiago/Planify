import { getSiteUrl } from "@/lib/seo/site-url";

type EmailRecipient = string | string[];

type PlanifyEmailParams = {
  to: EmailRecipient;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SupportContactEmailParams = {
  nome: string;
  email: string;
  perfil: string;
  tipo: string;
  assunto: string;
  mensagem: string;
  pageUrl?: string;
  userAgent?: string;
};

export type WelcomeEmailParams = {
  email: string;
  name?: string | null;
  planName?: string | null;
  checkoutSessionId?: string | null;
  subscriptionId?: string | null;
};

export type AccessConfirmationEmailParams = {
  email: string;
  name?: string | null;
  userId?: string | null;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Planify <contato@iaplanify.com.br>";
const DEFAULT_REPLY_TO = "contato@iaplanify.com.br";
const DEFAULT_SUPPORT_EMAIL = "ts162351@gmail.com";

function clean(value: unknown, maxLength: number): string {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value: unknown, maxLength: number): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeRecipients(to: EmailRecipient): string[] {
  const recipients = Array.isArray(to) ? to : [to];

  return recipients
    .map((recipient) => clean(recipient, 200).toLowerCase())
    .filter((recipient) => recipient.includes("@"));
}

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY ausente no ambiente do servidor.");
  }

  return apiKey;
}

function getFromEmail(): string {
  return clean(process.env.RESEND_FROM_EMAIL || DEFAULT_FROM, 240);
}

function getReplyToEmail(): string {
  return clean(process.env.RESEND_REPLY_TO || DEFAULT_REPLY_TO, 200);
}

function getSupportEmail(): string {
  return clean(process.env.CONTACT_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL, 200);
}

function getBaseUrl(): string {
  return getSiteUrl().replace(/\/$/, "");
}

function buildEmailShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
            <tr>
              <td style="padding:28px 28px 12px">
                <p style="margin:0 0 8px;color:#0891b2;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Planify</p>
                <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:1.25">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;font-size:15px;line-height:1.7;color:#334155">
                ${body}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#64748b;font-size:12px">Planify • iaplanify.com.br</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function paragraph(value: string): string {
  return `<p style="margin:0 0 14px">${escapeHtml(value)}</p>`;
}

function button(label: string, href: string): string {
  return `<p style="margin:22px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;font-weight:800;border-radius:999px;padding:12px 18px">${escapeHtml(label)}</a></p>`;
}

function tableRows(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:16px 0">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="width:140px;border:1px solid #e2e8f0;background:#f8fafc;padding:9px 10px;font-weight:800;color:#0f172a">${escapeHtml(label)}</td><td style="border:1px solid #e2e8f0;padding:9px 10px;color:#334155">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>`;
}

function buildText(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function parseResendResponse(raw: string): {
  id?: string;
  message?: string;
  error?: string;
} | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      id?: string;
      message?: string;
      error?: string;
    };
  } catch {
    return { message: raw.slice(0, 500) };
  }
}

export function logPlanifyEmailError(
  context: string,
  error: unknown,
  meta: Record<string, string | null | undefined> = {},
) {
  console.error("[email] send failed", {
    context,
    message: error instanceof Error ? error.message : String(error),
    ...meta,
  });
}

export async function sendPlanifyEmail(
  params: PlanifyEmailParams,
): Promise<{ id: string | null }> {
  const recipients = normalizeRecipients(params.to);

  if (recipients.length === 0) {
    throw new Error("Nenhum destinatario valido informado para envio de e-mail.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getResendApiKey()}`,
    "Content-Type": "application/json",
  };

  if (params.idempotencyKey) {
    headers["Idempotency-Key"] = clean(params.idempotencyKey, 240);
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: getFromEmail(),
      to: recipients,
      reply_to: params.replyTo || getReplyToEmail(),
      subject: clean(params.subject, 180),
      text: params.text,
      html: params.html,
      tags: params.tags,
    }),
  });

  const raw = await response.text().catch(() => "");
  const data = parseResendResponse(raw);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Resend retornou HTTP ${response.status}.`;
    throw new Error(message);
  }

  return { id: data?.id || null };
}

export async function sendWelcomeEmail(
  params: WelcomeEmailParams,
): Promise<{ id: string | null }> {
  const planName = clean(params.planName || "Planify Professor", 120);
  const firstName = clean(params.name, 80);
  const activateUrl = new URL("/planos/sucesso", getBaseUrl());
  activateUrl.searchParams.set("checkout", "success");

  if (params.checkoutSessionId) {
    activateUrl.searchParams.set("session_id", params.checkoutSessionId);
  }

  const title = "Bem-vindo ao Planify";
  const greeting = firstName ? `Olá, ${firstName}.` : "Olá.";
  const html = buildEmailShell(
    title,
    [
      paragraph(greeting),
      paragraph(
        `Seu pagamento do ${planName} foi confirmado. Agora você pode ativar sua conta e começar a criar planejamentos, materiais, avaliações e documentos com o Planify.`,
      ),
      button("Ativar minha conta", activateUrl.toString()),
      paragraph(
        "Use o mesmo e-mail informado no pagamento para criar sua senha de acesso.",
      ),
    ].join(""),
  );

  const text = buildText([
    title,
    "",
    greeting,
    `Seu pagamento do ${planName} foi confirmado.`,
    "Ative sua conta e crie sua senha usando o mesmo e-mail informado no pagamento:",
    activateUrl.toString(),
  ]);

  return sendPlanifyEmail({
    to: params.email,
    subject: title,
    text,
    html,
    idempotencyKey:
      params.checkoutSessionId
        ? `welcome:${params.checkoutSessionId}`
        : params.subscriptionId
          ? `welcome:${params.subscriptionId}`
          : undefined,
    tags: [{ name: "kind", value: "welcome" }],
  });
}

export async function sendAccessConfirmationEmail(
  params: AccessConfirmationEmailParams,
): Promise<{ id: string | null }> {
  const firstName = clean(params.name, 80);
  const dashboardUrl = new URL("/dashboard", getBaseUrl()).toString();
  const title = "Seu acesso ao Planify foi confirmado";
  const greeting = firstName ? `Olá, ${firstName}.` : "Olá.";
  const html = buildEmailShell(
    title,
    [
      paragraph(greeting),
      paragraph(
        "Sua conta foi ativada com sucesso. O acesso premium já está liberado para você entrar no painel e usar as ferramentas do Planify.",
      ),
      button("Abrir o Planify", dashboardUrl),
      paragraph(
        "Se você não reconhece esta ativação, responda este e-mail para falar com o suporte.",
      ),
    ].join(""),
  );

  const text = buildText([
    title,
    "",
    greeting,
    "Sua conta foi ativada com sucesso e o acesso premium ja esta liberado.",
    `Abrir o Planify: ${dashboardUrl}`,
  ]);

  return sendPlanifyEmail({
    to: params.email,
    subject: title,
    text,
    html,
    idempotencyKey: params.userId ? `access-confirmed:${params.userId}` : undefined,
    tags: [{ name: "kind", value: "access_confirmation" }],
  });
}

export async function sendSupportContactEmail(
  params: SupportContactEmailParams,
): Promise<{ id: string | null }> {
  const payload = {
    nome: clean(params.nome, 120),
    email: clean(params.email, 160).toLowerCase(),
    perfil: clean(params.perfil, 80) || "Não informado",
    tipo: clean(params.tipo, 80) || "suporte",
    assunto: clean(params.assunto, 180),
    mensagem: cleanMultiline(params.mensagem, 5000),
    pageUrl: clean(params.pageUrl, 500),
    userAgent: clean(params.userAgent, 300),
  };

  const title = `Contato Planify - ${payload.tipo} - ${payload.assunto}`;
  const rows: Array<[string, string]> = [
    ["Nome", payload.nome],
    ["E-mail", payload.email],
    ["Perfil", payload.perfil],
    ["Tipo", payload.tipo],
    ["Assunto", payload.assunto],
    ["Página", payload.pageUrl || "Não informada"],
  ];
  const html = buildEmailShell(
    "Nova mensagem do contato Planify",
    [
      paragraph("Uma nova mensagem foi enviada pela página de contato."),
      tableRows(rows),
      `<h2 style="margin:18px 0 8px;font-size:16px;color:#0f172a">Mensagem</h2>`,
      `<p style="margin:0;white-space:pre-wrap">${escapeHtml(payload.mensagem)}</p>`,
    ].join(""),
  );
  const text = buildText([
    "Nova mensagem enviada pela página de contato do Planify.",
    "",
    `Nome: ${payload.nome}`,
    `E-mail: ${payload.email}`,
    `Perfil: ${payload.perfil}`,
    `Tipo: ${payload.tipo}`,
    `Assunto: ${payload.assunto}`,
    "",
    "Mensagem:",
    payload.mensagem,
    "",
    payload.pageUrl ? `Página de origem: ${payload.pageUrl}` : "",
    payload.userAgent ? `Navegador: ${payload.userAgent}` : "",
  ]);

  return sendPlanifyEmail({
    to: getSupportEmail(),
    replyTo: payload.email,
    subject: title,
    text,
    html,
    tags: [{ name: "kind", value: "support_contact" }],
  });
}
