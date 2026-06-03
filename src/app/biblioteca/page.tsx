import { PageShell } from "../../components/PageShell";
import PremiumAccessGate from "../../components/premium/PremiumAccessGate";
import { BibliotecaClient } from "./BibliotecaClient";

export const dynamic = "force-dynamic";

export default function BibliotecaPage() {
  return (
    <PremiumAccessGate featureName="a Biblioteca Premium">
      <PageShell>
        <div className="planify-ui3">
          <BibliotecaClient />
        </div>
      </PageShell>
    </PremiumAccessGate>
  );
}
