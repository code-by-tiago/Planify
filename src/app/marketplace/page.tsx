import { PageShell } from "../../components/PageShell";
import { PageHero } from "../../components/PageHero";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Marketplace Premium"
        title="Troca real de materiais entre professores."
        description="Publique, encontre e baixe materiais pedagógicos compartilhados por professores com acesso premium."
        primaryLabel="Publicar material"
        primaryHref="#marketplace"
        secondaryLabel="Biblioteca Premium"
        secondaryHref="/biblioteca"
      />

      <div id="marketplace">
        <MarketplaceClient />
      </div>
    </PageShell>
  );
}
