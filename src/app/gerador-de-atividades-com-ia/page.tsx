import type { Metadata } from "next";
import { StrategicLandingPage } from "@/components/public/StrategicLandingPage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getStrategicPageByPath } from "@/lib/seo/strategic-pages";

const PATH = "/gerador-de-atividades-com-ia";
const content = getStrategicPageByPath(PATH)!;

export const metadata: Metadata = buildPageMetadata({
  title: content.title,
  description: content.description,
  path: PATH,
});

export default function GeradorDeAtividadesComIaPage() {
  return <StrategicLandingPage content={content} />;
}
