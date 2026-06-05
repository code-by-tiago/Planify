import { PageShell } from "../../components/PageShell";
import { PageHero } from "../../components/PageHero";
import { HistoricoClient } from "./HistoricoClient";

export const dynamic = "force-dynamic";

export default function HistoricoPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Histórico Planify"
        title="Acompanhe seus planejamentos, materiais e documentos editados."
        description="Histórico local provisório para organizar os documentos gerados antes da integração definitiva com Supabase."
        primaryLabel="Planejamentos"
        primaryHref="/planejamentos"
        secondaryLabel="Materiais"
        secondaryHref="/materiais"
      />

      <HistoricoClient />
    </PageShell>
  );
}
