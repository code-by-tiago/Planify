import Link from "next/link";
import { getOwnerPageAccess } from "../../server/auth/owner-access";
import { OwnerAccessGate } from "../../components/OwnerAccessGate";
import { AdminSecurityBar } from "../../components/AdminSecurityBar";
import { AdminTabSessionGuard } from "../../components/AdminTabSessionGuard";
import { PageShell } from "../../components/PageShell";
import { AdminControleClient } from "./AdminControleClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const owner = await getOwnerPageAccess();

  if (!owner.authenticated || !owner.isOwner) {
    return (
      <PageShell>
        <OwnerAccessGate
          authenticated={owner.authenticated}
          email={owner.email}
          redirectTo="/admin"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="planify-hud min-h-0 flex-1 overflow-y-auto bg-[var(--planify-canvas)]">
        <AdminTabSessionGuard>
          <AdminSecurityBar />

          <section className="mx-auto max-w-7xl px-5 pb-4 pt-6 sm:px-8">
            <p className="pl-hud-badge inline-flex">Proprietário · Controle</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Central de administração
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Visão completa do Planify — usuários, gerações, créditos, integrações
              e ferramentas de curadoria.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/biblioteca" className="pl-hud-btn rounded-full px-5 py-2.5 text-sm font-bold">
                Biblioteca Premium
              </Link>
              <Link
                href="/dashboard"
                className="pl-hud-btn-secondary rounded-full px-5 py-2.5 text-sm font-bold"
              >
                Ir ao painel
              </Link>
            </div>
          </section>

          <AdminControleClient />
        </AdminTabSessionGuard>
      </div>
    </PageShell>
  );
}
