export const dynamic = "force-dynamic";

import { MarketplaceMaterialViewClient } from "@/components/community/MarketplaceMaterialViewClient";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";

type MarketplaceMaterialPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarketplaceMaterialPage({ params }: MarketplaceMaterialPageProps) {
  const { id } = await params;

  return (
    <PremiumAccessGate featureName="a Comunidade">
      <MarketplaceMaterialViewClient materialId={id} />
    </PremiumAccessGate>
  );
}
