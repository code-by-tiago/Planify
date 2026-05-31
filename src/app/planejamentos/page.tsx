import { PlanifyFieldEnhancer } from "@/components/PlanifyFieldEnhancer";
import { PlanejamentosClient } from "./PlanejamentosClient";

export default function PlanejamentosPage() {
  return (
    <>
      <PlanejamentosClient />
      <PlanifyFieldEnhancer />
    </>
  );
}
