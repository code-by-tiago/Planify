import Link from "next/link";
import { getAdminPageAccess } from "../../server/auth/admin-access";
import { AdminAccessGate } from "../../components/AdminAccessGate";
import { AdminSecurityBar } from "../../components/AdminSecurityBar";
import { AdminTabSessionGuard } from "../../components/AdminTabSessionGuard";
import { PageShell } from "../../components/PageShell";
import { PageHero } from "../../components/PageHero";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminPageAccess();

  if (!admin.authenticated || !admin.isAdmin) {
    return (
      <PageShell>
        <AdminAccessGate
          authenticated={admin.authenticated}
          email={admin.email}
          redirectTo="/admin"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AdminTabSessionGuard>
        <AdminSecurityBar />

        <PageHero
          eyebrow="Admin Planify"
          title="Central privada do dono do site."
          description="Painel administrativo para gestão do Planify."
          primaryLabel="Gerir Biblioteca"
          primaryHref="/admin/biblioteca"
          secondaryLabel="Dashboard"
          secondaryHref="/dashboard"
        />

        <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-8 sm:px-8 lg:grid-cols-3">
          {[
            {
              title: "Biblioteca Premium",
              text: "Cadastrar materiais oficiais, anexos e metadados pedagógicos.",
              href: "/admin/biblioteca",
            },
            {
              title: "Assinaturas",
              text: "Conferir pagamentos, planos e acesso premium.",
              href: "/planos",
            },
            {
              title: "Auditoria",
              text: "Conferir estrutura, build e segurança antes do deploy.",
              href: "/admin",
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300">
                Admin
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{card.text}</p>
            </Link>
          ))}
        </section>

        <AdminClient />
      </AdminTabSessionGuard>
    </PageShell>
  );
}
