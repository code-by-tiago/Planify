import type { MetadataRoute } from "next";

export type PublicSitemapEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

export const PUBLIC_SITEMAP_PAGES: PublicSitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/planos", changeFrequency: "weekly", priority: 0.9 },
  { path: "/escolas", changeFrequency: "monthly", priority: 0.8 },
  { path: "/planejamento-escolar-com-ia", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gerador-de-atividades-com-ia", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gerador-de-provas-com-ia", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gerador-de-jogos-pedagogicos", changeFrequency: "monthly", priority: 0.8 },
  { path: "/apostilas-com-ia-para-professores", changeFrequency: "monthly", priority: 0.8 },
  { path: "/editor-de-documentos-para-professores", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contato", changeFrequency: "monthly", priority: 0.6 },
  { path: "/login", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.3 },
  { path: "/termos", changeFrequency: "yearly", priority: 0.3 },
];

export const PRIVATE_ROBOTS_DISALLOW = [
  "/dashboard",
  "/planejamentos",
  "/materiais",
  "/editor",
  "/historico",
  "/biblioteca",
  "/marketplace",
  "/admin",
  "/gestor",
  "/diretor",
  "/bncc",
  "/progresso-bncc",
  "/api/",
  "/acesso-negado",
] as const;
