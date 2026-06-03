export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { MarketplaceClient } from "@/app/marketplace/MarketplaceClient";

export default function MarketplacePage() {
  return (
    <PremiumAccessGate featureName="o Marketplace">
      <MarketplaceClient />
    </PremiumAccessGate>
  );
}
