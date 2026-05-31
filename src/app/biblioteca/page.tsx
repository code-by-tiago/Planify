import { PageShell } from "../../components/PageShell";
import { PageHero } from "../../components/PageHero";
import { BibliotecaClient } from "./BibliotecaClient";

export const dynamic = "force-dynamic";

export default function BibliotecaPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Biblioteca Premium"
        title="Materiais didáticos premium selecionados para apoiar sua rotina pedagógica."
        description="Acesse recursos reais e organizados para usar, adaptar e baixar quando precisar. A página fica pronta para receber seus uploads, com materiais reais."
        primaryLabel="Gerar planejamento"
        primaryHref="/planejamentos"
        secondaryLabel="Abrir Editor"
        secondaryHref="/editor"
      />

      <BibliotecaClient />
    </PageShell>
  );
}
