import { PageShell } from "../../../components/PageShell";
import { PageHero } from "../../../components/PageHero";
import PremiumAccessGate from "../../../components/premium/PremiumAccessGate";
import { NewMarketplaceItemClient } from "./NewMarketplaceItemClient";

export const dynamic = "force-dynamic";

export default function NewMarketplaceItemPage() {
  return (
    <PremiumAccessGate featureName="a publicação no Marketplace">
      <PageShell>
        <PageHero
          eyebrow="Publicar material"
          title="Prepare um material para compartilhar no Marketplace."
          description="Cadastre as informações pedagógicas, anexe um arquivo e revise a prévia antes de publicar."
          primaryLabel="Voltar ao Marketplace"
          primaryHref="/marketplace"
          secondaryLabel="Ver Biblioteca"
          secondaryHref="/biblioteca"
        />

        <NewMarketplaceItemClient />
      </PageShell>
    </PremiumAccessGate>
  );
}
