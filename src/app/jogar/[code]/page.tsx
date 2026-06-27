import { JogarAulaClient } from "@/app/jogar/[code]/JogarAulaClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Aula ao vivo | IAPlanify",
};

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function JogarAulaPage({ params }: PageProps) {
  const { code } = await params;
  return <JogarAulaClient initialCode={code} />;
}
