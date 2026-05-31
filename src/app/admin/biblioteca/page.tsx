import { getAdminPageAccess } from "../../../server/auth/admin-access";
import { AdminAccessGate } from "../../../components/AdminAccessGate";
import { AdminSecurityBar } from "../../../components/AdminSecurityBar";
import { AdminTabSessionGuard } from "../../../components/AdminTabSessionGuard";
import { PageShell } from "../../../components/PageShell";
import { PageHero } from "../../../components/PageHero";
import { AdminBibliotecaClient } from "./AdminBibliotecaClient";

export const dynamic = "force-dynamic";

export default async function AdminBibliotecaPage() {
  const admin = await getAdminPageAccess();

  if (!admin.authenticated || !admin.isAdmin) {
    return (
      <PageShell>
        <AdminAccessGate
          authenticated={admin.authenticated}
          email={admin.email}
          redirectTo="/admin/biblioteca"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AdminTabSessionGuard>
        <AdminSecurityBar />

        <PageHero
          eyebrow="Admin Biblioteca"
          title="Cadastre materiais oficiais para a Biblioteca Premium."
          description="Área privada do administrador para publicar materiais reais no acervo premium."
          primaryLabel="Voltar ao Admin"
          primaryHref="/admin"
          secondaryLabel="Ver Biblioteca Premium"
          secondaryHref="/biblioteca"
        />

        <AdminBibliotecaClient />
      </AdminTabSessionGuard>
    </PageShell>
  );
}
