import { PageHero } from "../../components/PageHero";
import { PageShell } from "../../components/PageShell";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";

export default function EditorPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Editor Planify"
        title="Editor avançado estilo Word."
        description="Edite planejamentos, materiais, tabelas e imagens com ferramentas visuais, salvamento local, impressão e exportação compatível com Word."
        primaryLabel="Começar edição"
        primaryHref="#editor"
        secondaryLabel="Histórico"
        secondaryHref="/historico"
      />

      <div id="editor">
        <EditorClient />
      </div>
    </PageShell>
  );
}
