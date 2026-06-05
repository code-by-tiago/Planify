import { getCurrentAccessToken } from "@/lib/auth/session-client";

export type MarketplacePublishInput = {
  title: string;
  description: string;
  html: string;
  etapa?: string;
  anoSerie?: string;
  componente?: string;
  tipoMaterial?: string;
  tema?: string;
  tags?: string[];
  authorName?: string;
};

export type MarketplacePublishResult = {
  id: string;
  title: string;
};

function wrapHtmlDocument(title: string, html: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${title.replace(/[<>&"]/g, "")}</title>
<style>
body{font-family:"Times New Roman",Times,serif;line-height:1.5;color:#0f172a;padding:2cm;max-width:21cm;margin:0 auto;}
table{border-collapse:collapse;width:100%;}
td,th{border:1px solid #cbd5e1;padding:8px;}
img{max-width:100%;height:auto;}
</style>
</head>
<body>${html}</body>
</html>`;
}

export async function publishHtmlToMarketplace(
  input: MarketplacePublishInput,
): Promise<MarketplacePublishResult> {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    throw new Error("Informe o título do material.");
  }

  if (!description) {
    throw new Error("Informe uma descrição para a comunidade.");
  }

  if (!input.html.trim()) {
    throw new Error("O conteúdo está vazio.");
  }

  const token = await getCurrentAccessToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const safeName = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  // text/plain: o bucket Supabase marketplace-materiais não lista text/html.
  const documentHtml = wrapHtmlDocument(title, input.html);
  const file = new File(
    [documentHtml],
    `${safeName || "material-planify"}.html`,
    { type: "text/html;charset=utf-8" },
  );

  const body = new FormData();
  body.set("title", title);
  body.set("description", description);
  body.set("etapa", input.etapa || "Ensino Fundamental");
  body.set("anoSerie", input.anoSerie || "Geral");
  body.set("componente", input.componente || "Multicomponente");
  body.set("tipoMaterial", input.tipoMaterial || "Material de apoio");
  body.set("tema", input.tema || title);
  body.set("tags", (input.tags || ["planify", "comunidade"]).join(", "));
  body.set("authorName", input.authorName || "Professor");
  body.set("isPublished", "true");
  body.set("file", file);

  const response = await fetch("/api/marketplace/materiais", {
    method: "POST",
    body,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Não foi possível publicar no Marketplace.");
  }

  return {
    id: String(data?.item?.id || ""),
    title: String(data?.item?.title || title),
  };
}
