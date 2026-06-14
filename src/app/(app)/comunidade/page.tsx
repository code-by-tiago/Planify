export const dynamic = "force-dynamic";

import ComunidadeDocenteClient from "@/app/comunidade/ComunidadeDocenteClient";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";

export default function ComunidadePage() {
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteClient />
    </PremiumAccessGate>
  );
}
