export const dynamic = "force-dynamic";

import { MarketplaceMaterialViewClient } from "@/components/community/MarketplaceMaterialViewClient";

type MarketplaceMaterialPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarketplaceMaterialPage({ params }: MarketplaceMaterialPageProps) {
  const { id } = await params;

  return (
    <MarketplaceMaterialViewClient materialId={id} />
  );
}
