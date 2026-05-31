import { PageShell } from "../../components/PageShell";
import { PageHero } from "../../components/PageHero";
import { ContatoClient } from "./ContatoClient";

export const dynamic = "force-dynamic";

export default function ContatoPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contato e Suporte"
        title="Atendimento para professores e gestão do Planify."
        description="Envie dúvidas sobre assinatura, acesso, erros, sugestões, parcerias ou suporte pedagógico."
        primaryLabel="Ver planos"
        primaryHref="/planos"
        secondaryLabel="Voltar ao dashboard"
        secondaryHref="/dashboard"
      />

      <ContatoClient />
    </PageShell>
  );
}
