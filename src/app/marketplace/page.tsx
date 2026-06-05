import { PageShell } from "../../components/PageShell";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <PageShell>
      <div id="marketplace">
        <MarketplaceClient />
      </div>
    </PageShell>
  );
}
