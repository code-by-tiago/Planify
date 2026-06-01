import { PremiumRouteGuard } from "../../components/PremiumRouteGuard";
import { PlanejamentosClient } from "./PlanejamentosClient";

export const dynamic = "force-dynamic";

export default function PlanejamentosPage() {
  return (
    <>
      <PremiumRouteGuard />
      <PlanejamentosClient />
    </>
  );
}
