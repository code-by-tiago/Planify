import { getOwnerPageAccess } from "../../../server/auth/owner-access";
import { OwnerAccessGate } from "../../../components/OwnerAccessGate";
import { AdminSecurityBar } from "../../../components/AdminSecurityBar";
import { AdminTabSessionGuard } from "../../../components/AdminTabSessionGuard";
import { PageShell } from "../../../components/PageShell";
import { PageHero } from "../../../components/PageHero";
import { AdminBibliotecaClient } from "./AdminBibliotecaClient";

export const dynamic = "force-dynamic";

export default async function AdminBibliotecaPage() {
  const owner = await getOwnerPageAccess();

  if (!owner.authenticated || !owner.isOwner) {
    return (
      <PageShell>
        <OwnerAccessGate
          authenticated={owner.authenticated}
          email={owner.email}
          redirectTo="/admin/biblioteca"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="planify-hud min-h-0 flex-1 overflow-y-auto bg-[var(--planify-canvas)]">
        <AdminTabSessionGuard>
          <AdminSecurityBar />

          <PageHero
            eyebrow="Proprietário · Biblioteca"
            title="Cadastre materiais oficiais para a Biblioteca Premium."
            description="Área privada do proprietário para publicar materiais reais no acervo premium."
            primaryLabel="Voltar ao controle"
            primaryHref="/admin"
            secondaryLabel="Ver Biblioteca Premium"
            secondaryHref="/biblioteca"
          />

          <AdminBibliotecaClient />
        </AdminTabSessionGuard>
      </div>
    </PageShell>
  );
}
