import { PageShell } from "../../components/PageShell";
import PremiumAccessGate from "../../components/premium/PremiumAccessGate";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <PremiumAccessGate featureName="o Marketplace">
      <PageShell>
        <div className="planify-ui3" id="marketplace">
          <MarketplaceClient />
        </div>
      </PageShell>
    </PremiumAccessGate>
  );
}
