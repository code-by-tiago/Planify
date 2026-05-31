import { PageShell } from "../../components/PageShell";
import { PageHero } from "../../components/PageHero";
import { MateriaisClient } from "./MateriaisClient";

export const dynamic = "force-dynamic";

export default function MateriaisPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Materiais Didáticos com IA"
        title="Gere atividades, provas, apostilas, jogos e sequências com IA."
        description="Preencha os dados pedagógicos, escolha o tipo de material e gere um conteúdo estruturado para revisar no editor."
        primaryLabel="Abrir editor"
        primaryHref="/editor"
        secondaryLabel="Ver histórico"
        secondaryHref="/historico"
      />

      <MateriaisClient />
    </PageShell>
  );
}
