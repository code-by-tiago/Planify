import { PageBackNavigation } from "../../components/PageBackNavigation";
import { PremiumRouteGuard } from "../../components/PremiumRouteGuard";
import { PlanejamentosClient } from "./PlanejamentosClient";

export const dynamic = "force-dynamic";

export default function PlanejamentosPage() {
  return (
    <>
      <PremiumRouteGuard />
      <PageBackNavigation />
      <PlanejamentosClient />
    </>
  );
}
