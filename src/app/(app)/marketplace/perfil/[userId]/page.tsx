export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { PublicProfileClient } from "@/components/community/PublicProfileClient";

type PublicProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params;

  return (
    <PremiumAccessGate featureName="a Comunidade">
      <PublicProfileClient userId={userId} />
    </PremiumAccessGate>
  );
}
