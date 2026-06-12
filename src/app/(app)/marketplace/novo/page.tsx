export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { NewMarketplaceItemClient } from "@/app/marketplace/novo/NewMarketplaceItemClient";

export default function NewMarketplaceItemPage() {
  return (
    <PremiumAccessGate featureName="a publicação na Comunidade">
      <NewMarketplaceItemClient />
    </PremiumAccessGate>
  );
}
