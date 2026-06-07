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
      <div className="planify-hud min-h-0 flex-1 overflow-y-auto bg-[#050810]">
        <AdminTabSessionGuard>
          <AdminSecurityBar />

          <section className="mx-auto max-w-[1600px] px-4 pb-2 pt-6 sm:px-6 lg:px-8">
            <p className="inline-flex rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Enterprise Command Center
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
              Operações Planify
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              Monitoramento B2B, consumo Gemini, crescimento, kill switch e gestão
              de escolas, usuários e materiais IA — visão autoritativa para o
              proprietário.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/admin/biblioteca"
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Biblioteca Premium
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 transition hover:text-slate-200"
              >
                Painel professor
              </Link>
            </div>
          </section>

          <AdminControleClient />
        </AdminTabSessionGuard>
      </div>
    </PageShell>
  );
}
