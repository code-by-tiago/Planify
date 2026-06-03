export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { MateriaisClient } from "@/app/materiais/MateriaisClient";

export default function MateriaisPage() {
  return (
    <PremiumAccessGate featureName="o Gerador IA de Materiais">
      <MateriaisClient />
    </PremiumAccessGate>
  );
}
