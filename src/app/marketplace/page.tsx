import { PageShell } from "../../components/PageShell";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <PageShell>
      <div className="planify-ui3" id="marketplace">
        <MarketplaceClient />
      </div>
    </PageShell>
  );
}
