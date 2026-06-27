import Link from "next/link";
import { getOwnerPageAccess } from "@/server/auth/owner-access";
import { OwnerAccessGate } from "@/components/OwnerAccessGate";
import { AdminSecurityBar } from "@/components/AdminSecurityBar";
import { AdminTabSessionGuard } from "@/components/AdminTabSessionGuard";
import { PageShell } from "@/components/PageShell";
import { AdminCorpusPanel } from "../components/AdminCorpusPanel";
import { AdminSidebarLinks } from "../components/AdminSidebarLinks";

export const dynamic = "force-dynamic";

export default async function AdminCorpusPage() {
  const owner = await getOwnerPageAccess();

  if (!owner.authenticated || !owner.isOwner) {
    return (
      <PageShell>
        <OwnerAccessGate
          authenticated={owner.authenticated}
          email={owner.email}
          redirectTo="/admin/corpus"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="planify-hud planify-admin min-h-0 flex-1 overflow-y-auto">
        <AdminTabSessionGuard>
          <AdminSecurityBar />

          <section className="mx-auto max-w-7xl px-4 pb-2 pt-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-cyan-400">Garimpo interno</p>
                <h1 className="mt-1 text-xl font-bold text-slate-100 sm:text-2xl">
                  Corpus RAG
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Curadoria de materiais de alta qualidade para enriquecer gerações. O impacto
                  aparece gradualmente via match BNCC/tema — não é mudança instantânea na UI.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin" className="pl-admin-btn-ghost px-4 py-2">
                  Voltar ao painel
                </Link>
              </div>
            </div>

            <div className="mt-4 lg:hidden">
              <AdminSidebarLinks />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <div className="pl-admin-shell overflow-hidden rounded-2xl p-5 sm:p-6">
              <AdminCorpusPanel />
            </div>
          </section>
        </AdminTabSessionGuard>
      </div>
    </PageShell>
  );
}
