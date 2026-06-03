export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { BibliotecaClient } from "@/app/biblioteca/BibliotecaClient";

export default function BibliotecaPage() {
  return (
    <PremiumAccessGate featureName="a Biblioteca Premium">
      <BibliotecaClient />
    </PremiumAccessGate>
  );
}
